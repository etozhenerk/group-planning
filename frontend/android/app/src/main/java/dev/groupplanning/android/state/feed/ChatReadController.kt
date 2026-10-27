package dev.groupplanning.android.state.feed

import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.models.ChatReadInfo
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.data.api.models.ServerCounter
import dev.groupplanning.android.data.api.models.UserProfile
import dev.groupplanning.android.data.repository.ChatReadRepository
import dev.groupplanning.android.data.session.MeetingAccess
import java.util.UUID
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

internal data class ChatReadingState(
    val enabled: Boolean = false,
    val info: ChatReadInfo? = null,
    val counts: Map<UUID, ServerCounter> = emptyMap(),
    val readerEntry: UUID? = null,
    val readers: List<UserProfile> = emptyList(),
    val loading: Boolean = false,
    val error: Boolean = false,
    val nextCursor: String? = null,
)

internal class ChatReadController(
    private val repository: ChatReadRepository,
    private val scope: CoroutineScope,
    private val now: () -> Long = { System.nanoTime() / 1_000_000 },
) {
    private val mutable = MutableStateFlow(ChatReadingState())
    val state = mutable.asStateFlow()
    private var access: MeetingAccess? = null
    private var active = false
    private var version = ServerCounter.Zero
    private var receiptVersion = ServerCounter.Zero
    private var desired = ServerCounter.Zero
    private var lastDispatch = Long.MIN_VALUE / 2
    private val seen = mutableMapOf<UUID, Pair<FeedEntry, Long>>()
    private var visibleOwn = emptyList<UUID>()
    private var qualification: Job? = null
    private var marker: Job? = null
    private var receipts: Job? = null
    private var people: Job? = null
    private var refreshReceipts = false
    private var peopleGeneration = 0

    fun enter(lease: MeetingAccess) {
        if (access != null && access != lease) revoke()
        access = lease
        active = true
    }

    fun synchronize(enabled: Boolean, info: ChatReadInfo?, revision: ServerCounter) {
        if (!enabled) {
            marker?.cancel()
            receipts?.cancel()
            people?.cancel()
            peopleGeneration++
            qualification?.cancel()
            seen.clear()
            mutable.value = ChatReadingState()
            return
        }
        if (info == null || revision < version) return
        val changed = revision > version || !state.value.enabled
        version = revision
        val actual = maxOf(info.actual, state.value.info?.actual ?: ServerCounter.Zero)
        mutable.value = state.value.copy(enabled = true, info = info.copy(actual = actual))
        if (changed) {
            refreshCounts()
            if (state.value.readerEntry != null) loadReaders()
        }
    }

    fun visible(entries: List<FeedEntry>, bottoms: List<FeedEntry>, eligible: Boolean) {
        val lease = access ?: return
        val own = entries.filter { it.kind == "message" && it.actor.id == lease.profile.id }
            .map { it.id }.distinct().take(100)
        if (own != visibleOwn) {
            visibleOwn = own
            mutable.value = state.value.copy(counts = state.value.counts.filterKeys { it in own })
            refreshCounts()
        }
        val candidates = if (eligible &&
            active &&
            state.value.enabled &&
            state.value.readerEntry == null
        ) {
            bottoms.filter { it.kind == "message" }
        } else {
            emptyList()
        }
        val ids = candidates.map { it.id }.toSet()
        seen.keys.retainAll(ids)
        candidates.forEach { entry -> seen.putIfAbsent(entry.id, entry to now()) }
        qualification?.cancel()
        qualification = scope.launch {
            while (active &&
                state.value.enabled &&
                state.value.readerEntry == null &&
                seen.isNotEmpty()
            ) {
                val remaining = seen.values.map { it.second + VISIBILITY_MS - now() }.filter {
                    it >
                        0
                }
                val qualified = seen.values.filter { now() - it.second >= VISIBILITY_MS }
                    .maxOfOrNull { it.first.sequence }
                if (qualified != null) {
                    desired = maxOf(desired, qualified)
                    dispatch()
                }
                if (remaining.isEmpty()) break
                delay(remaining.min())
            }
        }
    }

    private fun dispatch() {
        val lease = access ?: return
        if (!state.value.enabled ||
            desired <= (state.value.info?.actual ?: ServerCounter.Zero) ||
            marker?.isActive == true
        ) {
            return
        }
        marker = scope.launch {
            delay((lastDispatch + SEND_INTERVAL_MS - now()).coerceAtLeast(0))
            val target = desired
            lastDispatch = now()
            try {
                val result = repository.mark(lease, target)
                if (access == lease) synchronize(true, result.info, result.version)
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (error: ClientFailure) {
                // Desired is never presented as confirmed; next valid visibility can retry.
                if (error.status == 422) desired = state.value.info?.actual ?: ServerCounter.Zero
            } finally {
                marker = null
            }
            if (active && access == lease && desired > target) dispatch()
        }
    }

    private fun refreshCounts() {
        if (!active || !state.value.enabled || visibleOwn.isEmpty()) return
        refreshReceipts = true
        if (receipts?.isActive == true) return
        val lease = access ?: return
        receipts = scope.launch {
            while (refreshReceipts && active && access == lease) {
                refreshReceipts = false
                val ids = visibleOwn
                if (ids.isEmpty()) break
                try {
                    val response = repository.receipts(lease, ids)
                    if (access == lease && response.version >= receiptVersion) {
                        receiptVersion = response.version
                        mutable.value = state.value.copy(
                            counts = (
                                state.value.counts + response.receipts.associate {
                                    it.entry to it.count
                                }
                                ).filterKeys { it in visibleOwn },
                        )
                    }
                } catch (cancelled: CancellationException) {
                    throw cancelled
                } catch (_: ClientFailure) { /* No count is invented on failure. */ }
            }
        }
    }

    fun openReaders(entry: FeedEntry) {
        val lease = access ?: return
        if (!state.value.enabled ||
            entry.actor.id != lease.profile.id ||
            entry.kind != "message"
        ) {
            return
        }
        seen.clear()
        qualification?.cancel()
        mutable.value = state.value.copy(
            readerEntry = entry.id,
            readers = emptyList(),
            nextCursor = null,
            error = false,
        )
        loadReaders()
    }

    fun loadReaders(more: Boolean = false) {
        val lease = access ?: return
        val id = state.value.readerEntry ?: return
        val cursor = state.value.nextCursor.takeIf { more }
        if (more && (cursor == null || state.value.loading)) return
        val generation = ++peopleGeneration
        people?.cancel()
        mutable.value = state.value.copy(loading = true, error = false)
        people = scope.launch {
            try {
                var reset = false
                val response = try {
                    repository.readers(lease, id, cursor)
                } catch (error: ClientFailure) {
                    if (error.status == 410) {
                        reset = true
                        repository.readers(lease, id, null)
                    } else {
                        throw error
                    }
                }
                if (access == lease && generation == peopleGeneration) {
                    mutable.value = state.value.copy(
                        readers = if (more && cursor != null && !reset) {
                            (state.value.readers + response.readers).distinctBy { it.id }
                        } else {
                            response.readers
                        },
                        counts = state.value.counts + (id to response.count),
                        nextCursor = response.cursor,
                    )
                }
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (_: ClientFailure) {
                if (access == lease && generation == peopleGeneration) {
                    mutable.value = state.value.copy(error = true)
                }
            } finally {
                if (access == lease && generation == peopleGeneration) {
                    mutable.value = state.value.copy(loading = false)
                }
            }
        }
    }

    fun closeReaders() {
        peopleGeneration++
        people?.cancel()
        mutable.value = state.value.copy(
            readerEntry = null,
            readers = emptyList(),
            loading = false,
            error = false,
            nextCursor = null,
        )
    }

    fun leave() {
        active = false
        qualification?.cancel()
        seen.clear()
        receipts?.cancel()
        people?.cancel()
        // A previously qualified position may finish its best-effort PUT on departure.
        dispatch()
    }

    fun revoke() {
        active = false
        access = null
        qualification?.cancel()
        marker?.cancel()
        receipts?.cancel()
        people?.cancel()
        peopleGeneration++
        seen.clear()
        visibleOwn = emptyList()
        desired = ServerCounter.Zero
        version = ServerCounter.Zero
        receiptVersion = ServerCounter.Zero
        mutable.value = ChatReadingState()
    }

    private companion object {
        const val VISIBILITY_MS = 500L
        const val SEND_INTERVAL_MS = 1_000L
    }
}
