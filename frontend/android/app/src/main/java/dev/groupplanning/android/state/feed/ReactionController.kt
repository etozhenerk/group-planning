package dev.groupplanning.android.state.feed

import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.models.EntryReactions
import dev.groupplanning.android.data.api.models.MessageReaction
import dev.groupplanning.android.data.api.models.ReactionIntent
import dev.groupplanning.android.data.repository.FeedRepository
import dev.groupplanning.android.data.session.MeetingAccess
import java.util.UUID
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

internal data class ReactionState(
    val entries: Map<UUID, List<MessageReaction>> = emptyMap(),
    val pending: ReactionIntent? = null,
    val failed: ReactionIntent? = null,
    val picker: UUID? = null,
)

internal class ReactionController(
    private val repository: FeedRepository,
    private val scope: CoroutineScope,
) {
    private val mutable = MutableStateFlow(ReactionState())
    val state = mutable.asStateFlow()
    private var lease: MeetingAccess? = null
    private var visible = emptyList<UUID>()
    private var mutationVersion = 0L
    private var refreshVersion = 0L
    private var appliedRefresh = 0L

    fun open(access: MeetingAccess) {
        lease = access
    }
    fun revoke() {
        lease = null
        mutationVersion++
        visible = emptyList()
        mutable.value = ReactionState()
    }
    fun visible(ids: List<UUID>) {
        val next = ids.distinct().take(50)
        if (visible == next) return
        visible = next
        scope.launch { refresh() }
    }

    suspend fun refresh() {
        val access = lease ?: return
        if (visible.isEmpty()) return
        val version = mutationVersion
        val request = ++refreshVersion
        try {
            val result = repository.reactions(access, visible)
            if (lease == access && version == mutationVersion && request > appliedRefresh) {
                appliedRefresh = request
                val protected = state.value.pending?.entry
                mutable.value =
                    state.value.copy(
                        entries =
                        state.value.entries +
                            result.filter { it.entryId != protected }.associate {
                                it.entryId to
                                    it.reactions
                            },
                    )
            }
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (
            _: ClientFailure,
        ) { /* Keep last confirmed reactions while polling is unavailable. */ }
    }

    fun pick(entry: UUID?) {
        mutable.value = state.value.copy(picker = entry)
    }

    fun toggle(entry: UUID, emoji: String) {
        if (state.value.pending != null) return
        val active = state.value.entries[entry].orEmpty().none { it.emoji == emoji && it.mine }
        perform(ReactionIntent(entry, emoji, active))
    }
    fun retry() {
        state.value.failed?.let(::perform)
    }

    private fun perform(intent: ReactionIntent) {
        val access = lease ?: return
        if (state.value.pending != null) return
        mutationVersion++
        val confirmed = state.value.entries[intent.entry].orEmpty()
        val old = confirmed.find { it.emoji == intent.emoji }
        val changed = confirmed.filterNot { it.emoji == intent.emoji }.toMutableList()
        val count =
            (old?.count ?: 0) +
                if (intent.active &&
                    old?.mine != true
                ) {
                    1
                } else if (!intent.active && old?.mine == true) {
                    -1
                } else {
                    0
                }
        if (count > 0) {
            changed += MessageReaction(
                intent.emoji,
                count,
                intent.active,
                old?.users.orEmpty().filterNot { it.id == access.profile.id } +
                    listOfNotNull(access.profile.takeIf { intent.active }),
            )
        }
        mutable.value =
            state.value.copy(
                entries = state.value.entries + (intent.entry to changed),
                pending = intent,
                failed = null,
            )
        scope.launch {
            try {
                val response: EntryReactions = repository.react(access, intent)
                if (lease ==
                    access
                ) {
                    mutationVersion++
                    mutable.value =
                        state.value.copy(
                            entries =
                            state.value.entries + (intent.entry to response.reactions),
                            pending = null,
                        )
                }
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (_: ClientFailure) {
                if (lease ==
                    access
                ) {
                    mutationVersion++
                    mutable.value =
                        state.value.copy(
                            entries = state.value.entries + (intent.entry to confirmed),
                            pending = null,
                            failed = intent,
                        )
                }
            }
        }
    }
}
