package dev.groupplanning.android.state.feed

import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.models.ChatCapabilities
import dev.groupplanning.android.data.api.models.ChatProjection
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.data.api.models.ServerCounter
import dev.groupplanning.android.data.realtime.ChatSignal
import dev.groupplanning.android.data.repository.FeedRepository
import dev.groupplanning.android.data.session.MeetingAccess
import kotlin.random.Random
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

internal class FeedSync(
    private val repository: FeedRepository,
    private val state: MutableStateFlow<FeedState>,
    private val sender: MessageSender,
    private val jitter: (Long) -> Long = { (it * Random.nextDouble(0.85, 1.15)).toLong() },
    private val apply: suspend (List<FeedEntry>, List<ChatProjection>, Boolean) -> Unit,
) {
    private val signals = Channel<ChatSignal>(Channel.CONFLATED)
    private var scope: CoroutineScope? = null
    private var lease: MeetingAccess? = null
    private var capabilities: ChatCapabilities? = null
    private var transport: Job? = null
    private var fallback: Job? = null
    private var healthy = false
    private var subscribed = false
    private var verified = false
    private var verifyRequested = true
    private var revokeRequested = false
    private var personalRequested = false

    fun refresh() {
        signals.trySend(ChatSignal.Refresh)
    }

    suspend fun run(access: MeetingAccess): Unit = coroutineScope {
        scope = this
        lease = access
        verified = false
        verifyRequested = true
        healthy = false
        subscribed = false
        capabilities = null
        if (!state.value.ready) {
            val viewport = repository.snapshot.value.data.chatViewports[access.id]
            state.value = state.value.copy(viewport = viewport, anchor = viewport?.entry)
        }
        revokeRequested = false
        try {
            signals.trySend(ChatSignal.Refresh)
            while (isActive) {
                val event = signals.receive()
                if (revokeRequested) {
                    repository.chat.revoke(access)
                    return@coroutineScope
                }
                if (event == ChatSignal.Changed && state.value.ready) delay(100)
                val success = refreshNow(access)
                if (success) {
                    if (!sender.state.value.ready) sender.open(access)
                    if (verified) sender.resume()
                }
                val supported = capabilities?.realtime == true
                if (success && supported && transport == null) startTransport(access)
                if (healthy) {
                    fallback?.cancel()
                    fallback = null
                } else {
                    startFallback(if (supported) 10_000 else 3_000)
                }
            }
        } finally {
            fallback?.cancel()
            fallback = null
            transport?.cancel()
            transport = null
            scope = null
            lease = null
            healthy = false
            state.value =
                state.value.copy(loading = false, historyLoading = false, newerLoading = false)
        }
    }

    private fun startTransport(access: MeetingAccess) {
        transport = scope?.launch {
            while (isActive && lease == access) {
                try {
                    repository.chat.events(access).collect { event ->
                        if (lease != access) return@collect
                        when (event) {
                            ChatSignal.VerifySession -> verifyRequested = true
                            ChatSignal.AccessRevoked -> revokeRequested = true
                            ChatSignal.PersonalChanged -> personalRequested = true
                            ChatSignal.Subscribed -> {
                                subscribed = true
                                personalRequested = true
                            }
                            ChatSignal.Disconnected -> {
                                subscribed = false
                                healthy = false
                                startFallback(10_000)
                            }
                            else -> Unit
                        }
                        if (event != ChatSignal.Disconnected) signals.send(event)
                    }
                } catch (cancelled: CancellationException) {
                    throw cancelled
                } catch (_: ClientFailure) {
                    verifyRequested = true
                    subscribed = false
                    healthy = false
                    startFallback(10_000)
                }
                delay(3_000)
            }
        }
    }

    private fun startFallback(initial: Long) {
        if (fallback?.isActive == true) return
        fallback = scope?.launch {
            delay(initial)
            var wait = 3_000L
            while (isActive) {
                signals.send(ChatSignal.Refresh)
                delay(jitter(wait))
                wait = (wait * 2).coerceAtMost(30_000L)
            }
        }
    }

    private suspend fun refreshNow(access: MeetingAccess): Boolean {
        state.value = state.value.copy(loading = true)
        try {
            if (verifyRequested) {
                repository.chat.verify(access)
                verifyRequested = false
                verified = true
            }
            if (capabilities == null) capabilities = repository.chat.capabilities(access)
            state.value = state.value.copy(readEnabled = capabilities?.readState == true)
            if (capabilities?.sync == true) sync(access) else legacy(access)
            if (personalRequested) {
                // Authoritative HTTP is used even for terminal/personal hints.
                repository.chat.personal(access)
                personalRequested = false
            }
            healthy = subscribed
            return true
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (error: ClientFailure) {
            if (error.status == 403 || error.status == 404) {
                repository.chat.revoke(access)
            }
            if (lease == access) state.value = state.value.copy(loadError = true)
            healthy = false
            return false
        } finally {
            if (lease == access) state.value = state.value.copy(loading = false)
        }
    }

    private suspend fun snapshot(access: MeetingAccess) {
        val anchor = state.value.anchor
        val page = try {
            repository.chat.snapshot(access, anchor)
        } catch (error: ClientFailure) {
            if (anchor != null &&
                error.status == 404
            ) {
                repository.chat.snapshot(access)
            } else {
                throw error
            }
        }
        if (lease != access) return
        if (state.value.readEnabled && page.readInfo == null) {
            throw ClientFailure(dev.groupplanning.android.data.api.FailureKind.InvalidResponse)
        }
        val result = state.value.install(page)
        // DTO validation/reduction succeeds before the cursor is committed with the data.
        state.value = result.state
        apply(page.entries, result.projections, true)
        repository.chat.meeting(access, page.meeting)
        page.readInfo?.let { repository.reading.publish(access, it, page.version) }
        sender.acknowledge(page.entries)
    }

    private suspend fun sync(access: MeetingAccess) {
        if (state.value.changeCursor == null) snapshot(access)
        try {
            do {
                val cursor = state.value.changeCursor ?: return
                val page = repository.chat.changes(access, cursor)
                if (lease != access) return
                if (state.value.readEnabled && page.readInfo == null) {
                    throw ClientFailure(
                        dev.groupplanning.android.data.api.FailureKind.InvalidResponse,
                    )
                }
                val result = state.value.apply(page)
                state.value = result.state
                val entries = result.projections.mapNotNull { it.entry }
                apply(entries, result.projections, true)
                repository.chat.meeting(
                    access,
                    page.meeting,
                    refreshPeople = page.changes.any { it.kind == "meeting_changed" },
                )
                page.readInfo?.let { repository.reading.publish(access, it, page.version) }
                sender.acknowledge(entries)
            } while (page.hasMore)
        } catch (invalidated: ChatHistoryInvalidated) {
            snapshot(access)
        } catch (error: ClientFailure) {
            if (error.status == 410 && error.problem?.code == "sync_reset_required") {
                snapshot(access)
            } else {
                throw error
            }
        }
    }

    private suspend fun legacy(access: MeetingAccess) {
        do {
            val first = !state.value.ready || state.value.synchronized
            val page = repository.page(access, after = state.value.cursor.takeUnless { first })
            if (lease != access) return
            state.value = state.value.merge(page.entries).copy(
                ready = true,
                loadError = false,
                synchronized = false,
                changeCursor = null,
                streamEpoch = null,
                throughCursor = null,
                cursor =
                page.entries.lastOrNull()?.sequence ?: state.value.cursor ?: ServerCounter.Zero,
                hasHistory = if (first) page.hasMore else state.value.hasHistory,
            )
            sender.acknowledge(page.entries)
            apply(page.entries, emptyList(), false)
            val current = repository.snapshot.value.data.details[access.id]?.value
            if (current?.revision != page.meetingRevision) repository.details(access)
        } while (!first && page.hasMore)
    }

    fun tail() {
        val access = lease ?: return
        if (!state.value.hasNewer || state.value.newerLoading) return
        state.value = state.value.copy(newerLoading = true, newerError = false, anchor = null)
        scope?.launch {
            try {
                val page = repository.page(access)
                if (lease != access) return@launch
                state.value = state.value.copy(
                    entries = page.entries,
                    hasHistory = page.hasMore,
                    hasNewer = false,
                    viewport = dev.groupplanning.android.data.repository.ChatViewport(
                        null,
                        0f,
                        true,
                    ),
                    restoreRevision =
                    state.value.restoreRevision + 1,
                )
                apply(page.entries, emptyList(), state.value.synchronized)
                sender.acknowledge(page.entries)
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (_: ClientFailure) {
                if (lease == access) state.value = state.value.copy(newerError = true)
            } finally {
                if (lease == access) state.value = state.value.copy(newerLoading = false)
            }
        }
    }

    fun history(newer: Boolean = false) {
        val access = lease ?: return
        val before = state.value.entries.firstOrNull()?.sequence ?: return
        val after = state.value.entries.lastOrNull()?.sequence ?: return
        if (if (newer) {
                !state.value.hasNewer || state.value.newerLoading
            } else {
                !state.value.hasHistory || state.value.historyLoading
            }
        ) {
            return
        }
        state.value = if (newer) {
            state.value.copy(newerLoading = true, newerError = false)
        } else {
            state.value.copy(historyLoading = true, historyError = false)
        }
        scope?.launch {
            try {
                val page = repository.page(
                    access,
                    after = after.takeIf {
                        newer
                    },
                    before = before.takeUnless { newer },
                )
                if (lease != access) return@launch
                state.value =
                    if (newer) {
                        state.value.merge(page.entries, false).copy(hasNewer = page.hasMore)
                    } else {
                        state.value.merge(page.entries, false).copy(hasHistory = page.hasMore)
                    }
                sender.acknowledge(page.entries)
                apply(page.entries, emptyList(), state.value.synchronized)
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (_: ClientFailure) {
                if (lease == access) {
                    state.value = if (newer) {
                        state.value.copy(newerError = true)
                    } else {
                        state.value.copy(historyError = true)
                    }
                }
            } finally {
                if (lease ==
                    access
                ) {
                    state.value =
                        state.value.copy(historyLoading = false, newerLoading = false)
                }
            }
        }
    }
}
