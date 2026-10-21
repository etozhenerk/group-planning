package dev.groupplanning.android.state.feed

import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.models.ApiInstant
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.data.outbox.PendingMessage
import dev.groupplanning.android.data.repository.FeedRepository
import dev.groupplanning.android.data.session.MeetingAccess
import java.time.Instant
import java.util.UUID
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.Job
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

internal class MessageSender(
    private val repository: FeedRepository,
    private val scope: CoroutineScope,
    private val received: (FeedEntry) -> Unit,
) {
    private val mutable = MutableStateFlow(MessageState())
    val state = mutable.asStateFlow()
    private var access: MeetingAccess? = null
    private var operation: Job? = null

    suspend fun open(value: MeetingAccess) {
        access = value
        try {
            val saved = repository.record(value)
            mutable.value = MessageState(saved.draft, saved.pending, ready = true)
        } catch (_: ClientFailure) {
            mutable.value = MessageState(storageError = true)
        }
    }

    fun edit(text: String) {
        val lease = access ?: return
        val length = text.codePointCount(0, text.length)
        val previousLength = state.value.draft.codePointCount(0, state.value.draft.length)
        if (!state.value.ready ||
            state.value.sending ||
            (length > 4000 && length >= previousLength)
        ) {
            return
        }
        mutable.value = state.value.copy(draft = text)
        scope.launch(start = CoroutineStart.UNDISPATCHED) {
            try {
                withContext(NonCancellable) { repository.update(lease) { it.copy(draft = text) } }
                if (access == lease) mutable.value = state.value.copy(storageError = false)
            } catch (_: ClientFailure) {
                if (access == lease) mutable.value = state.value.copy(storageError = true)
            }
        }
    }

    fun send() {
        val lease = access ?: return
        if (!state.value.canSend) return
        val text = state.value.draft
        val pending =
            PendingMessage(UUID.randomUUID(), text.trim(), ApiInstant(Instant.now().toString()))
        mutable.value = state.value.copy(pending = pending, sending = true, draft = "")
        operation = scope.launch(start = CoroutineStart.UNDISPATCHED) {
            try {
                withContext(NonCancellable) {
                    repository.update(lease) { it.copy(pending = pending, draft = "") }
                }
                if (access == lease) mutable.value = state.value.copy(storageError = false)
                transmit(lease, pending)
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (_: ClientFailure) {
                // No POST before durable intent. Keep the text available if the disk write failed.
                if (access == lease) {
                    mutable.value = state.value.copy(
                        pending = null,
                        draft = text,
                        storageError = true,
                    )
                }
            } finally {
                if (access == lease) mutable.value = state.value.copy(sending = false)
            }
        }
    }

    fun retry() {
        val lease = access ?: return
        val pending = state.value.pending ?: return
        if (state.value.sending || pending.rejected) return
        mutable.value = state.value.copy(sending = true)
        operation = scope.launch(start = CoroutineStart.UNDISPATCHED) {
            try {
                transmit(lease, pending)
            } finally {
                if (access == lease) mutable.value = state.value.copy(sending = false)
            }
        }
    }

    private suspend fun transmit(lease: MeetingAccess, pending: PendingMessage) {
        try {
            val entry = repository.send(lease, pending)
            if (access != lease) return
            received(entry)
            acknowledge(listOf(entry))
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (error: ClientFailure) {
            if (access != lease) return
            if (error.status in listOf(400, 404, 409, 422) &&
                state.value.pending?.key == pending.key
            ) {
                val rejected = pending.copy(rejected = true)
                mutable.value = state.value.copy(pending = rejected)
                try {
                    repository.update(lease) { it.copy(pending = rejected) }
                } catch (_: ClientFailure) {
                    mutable.value = state.value.copy(storageError = true)
                }
            }
        }
    }

    suspend fun acknowledge(entries: List<FeedEntry>) {
        val lease = access ?: return
        val pending = state.value.pending ?: return
        if (entries.none {
                it.actor.id == lease.profile.id &&
                    it.clientRequestId == pending.key &&
                    it.messageText != null
            }
        ) {
            return
        }
        try {
            repository.update(lease) {
                if (it.pending?.key == pending.key) it.copy(pending = null) else it
            }
            if (access == lease) mutable.value = state.value.copy(pending = null)
        } catch (_: ClientFailure) {
            if (access == lease) mutable.value = state.value.copy(storageError = true)
        }
    }

    fun recoverRejected() {
        val lease = access ?: return
        val pending = state.value.pending?.takeIf { it.rejected } ?: return
        scope.launch {
            try {
                val saved = repository.update(lease) {
                    it.copy(
                        pending = null,
                        draft = listOf(pending.text, it.draft)
                            .filter(String::isNotEmpty).joinToString("\n"),
                    )
                }
                if (access == lease) {
                    mutable.value = state.value.copy(draft = saved.draft, pending = null)
                }
            } catch (_: ClientFailure) {
                if (access == lease) mutable.value = state.value.copy(storageError = true)
            }
        }
    }

    fun suspend() {
        operation?.cancel()
        operation = null
        mutable.value = state.value.copy(sending = false)
    }

    fun revoke() {
        suspend()
        access = null
        mutable.value = MessageState()
    }
}
