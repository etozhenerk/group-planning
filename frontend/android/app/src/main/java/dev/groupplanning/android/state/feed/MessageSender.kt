package dev.groupplanning.android.state.feed

import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.models.ApiInstant
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.data.outbox.DeliveryStatus
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
    private var active = false
    private var draftRevision = 0L

    suspend fun open(value: MeetingAccess) {
        access = value
        active = true
        try {
            val saved = repository.update(value) { record ->
                record.copy(
                    queue = record.queue.map {
                        if (it.status == DeliveryStatus.Sending) {
                            it.copy(status = DeliveryStatus.Uncertain)
                        } else {
                            it
                        }
                    },
                )
            }
            if (access == value) {
                mutable.value = MessageState(saved.draft, saved.queue, ready = true)
            }
        } catch (_: ClientFailure) {
            if (access == value) mutable.value = MessageState(storageError = true)
        }
    }

    fun edit(text: String) {
        val lease = access ?: return
        val length = text.codePointCount(0, text.length)
        val previous = state.value.draft.codePointCount(0, state.value.draft.length)
        if (!state.value.ready ||
            state.value.recovering ||
            length > 4000 &&
            length >= previous
        ) {
            return
        }
        val revision = ++draftRevision
        mutable.value = state.value.copy(draft = text)
        scope.launch(start = CoroutineStart.UNDISPATCHED) {
            try {
                withContext(NonCancellable) { repository.update(lease) { it.copy(draft = text) } }
                if (access == lease && draftRevision == revision) {
                    mutable.value = state.value.copy(storageError = false)
                }
            } catch (_: ClientFailure) {
                if (access == lease) mutable.value = state.value.copy(storageError = true)
            }
        }
    }

    fun send() {
        val lease = access ?: return
        if (!state.value.canSend) return
        val text = state.value.draft
        val revision = draftRevision
        val intent =
            PendingMessage(UUID.randomUUID(), text.trim(), ApiInstant(Instant.now().toString()))
        mutable.value = state.value.copy(saving = true)
        scope.launch(start = CoroutineStart.UNDISPATCHED) {
            try {
                val saved = withContext(NonCancellable) {
                    repository.update(lease) {
                        it.copy(
                            queue = it.queue + intent,
                            draft = if (it.draft ==
                                text
                            ) {
                                ""
                            } else {
                                it.draft
                            },
                        )
                    }
                }
                if (access != lease) return@launch
                mutable.value = state.value.copy(
                    queue = saved.queue,
                    draft = if (revision == draftRevision) "" else state.value.draft,
                    storageError = false,
                )
                drain()
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (_: ClientFailure) {
                if (access == lease) mutable.value = state.value.copy(storageError = true)
            } finally {
                if (access == lease) mutable.value = state.value.copy(saving = false)
            }
        }
    }

    fun resume() {
        active = true
        drain(retryUncertain = true)
    }

    fun retry(key: UUID? = null) {
        val lease = access ?: return
        val target = if (key == null) {
            state.value.queue.firstOrNull { !it.rejected }
        } else {
            state.value.queue.find { it.key == key }
        } ?: return
        if (target.rejected) {
            scope.launch {
                try {
                    changeStatus(lease, target.key, DeliveryStatus.Queued)
                    drain(retryUncertain = true)
                } catch (_: ClientFailure) {
                    if (access == lease) mutable.value = state.value.copy(storageError = true)
                }
            }
        } else if (state.value.queue.firstOrNull { !it.rejected }?.key == target.key) {
            drain(retryUncertain = true)
        }
    }

    private fun drain(retryUncertain: Boolean = false) {
        val lease = access ?: return
        if (!active || operation?.isActive == true) return
        operation = scope.launch {
            var mayRetry = retryUncertain
            while (active && access == lease) {
                val next = state.value.queue.firstOrNull { !it.rejected } ?: break
                if (next.status == DeliveryStatus.Uncertain && !mayRetry) break
                mayRetry = false
                try {
                    changeStatus(lease, next.key, DeliveryStatus.Sending)
                    val entry = repository.send(lease, next)
                    if (access != lease) break
                    received(entry)
                    if (!acknowledge(listOf(entry))) break
                } catch (cancelled: CancellationException) {
                    throw cancelled
                } catch (failure: ClientFailure) {
                    if (access != lease) break
                    val rejected = failure.status in listOf(400, 409, 422)
                    try {
                        changeStatus(
                            lease,
                            next.key,
                            if (rejected) DeliveryStatus.Rejected else DeliveryStatus.Uncertain,
                        )
                    } catch (_: ClientFailure) {
                        if (access == lease) mutable.value = state.value.copy(storageError = true)
                        break
                    }
                    if (!rejected) break
                }
            }
        }
    }

    private suspend fun changeStatus(lease: MeetingAccess, key: UUID, status: DeliveryStatus) {
        val saved = repository.update(lease) { record ->
            record.copy(
                queue = record.queue.map {
                    if (it.key ==
                        key
                    ) {
                        it.copy(status = status, rejected = status == DeliveryStatus.Rejected)
                    } else {
                        it
                    }
                },
            )
        }
        if (access == lease) mutable.value = state.value.copy(queue = saved.queue)
    }

    suspend fun acknowledge(entries: List<FeedEntry>): Boolean {
        val lease = access ?: return false
        val keys = state.value.queue.filter { intent ->
            entries.any { it.confirms(lease, intent) }
        }.map { it.key }.toSet()
        if (keys.isEmpty()) return true
        return try {
            val saved = repository.update(lease) {
                it.copy(queue = it.queue.filterNot { pending -> pending.key in keys })
            }
            if (access == lease) mutable.value = state.value.copy(queue = saved.queue)
            true
        } catch (_: ClientFailure) {
            if (access == lease) mutable.value = state.value.copy(storageError = true)
            false
        }
    }

    fun recoverRejected(key: UUID? = null) {
        val lease = access ?: return
        val pending =
            state.value.queue.firstOrNull { it.rejected && (key == null || it.key == key) }
                ?: return
        if (state.value.draft.isNotEmpty() || state.value.saving) return
        val revision = draftRevision
        mutable.value = state.value.copy(recovering = true)
        scope.launch(start = CoroutineStart.UNDISPATCHED) {
            try {
                val saved = repository.update(lease) {
                    if (it.draft.isEmpty()) {
                        it.copy(
                            queue = it.queue.filterNot { item -> item.key == pending.key },
                            draft = pending.text,
                        )
                    } else {
                        it
                    }
                }
                if (access == lease) {
                    mutable.value = state.value.copy(
                        queue = saved.queue,
                        draft = if (revision == draftRevision) saved.draft else state.value.draft,
                    )
                }
            } catch (_: ClientFailure) {
                if (access == lease) mutable.value = state.value.copy(storageError = true)
            } finally {
                if (access == lease) mutable.value = state.value.copy(recovering = false)
            }
        }
    }

    fun suspend() {
        active = false
        operation?.cancel()
        operation = null
        mutable.value = state.value.copy(
            queue = state.value.queue.map {
                if (it.status ==
                    DeliveryStatus.Sending
                ) {
                    it.copy(status = DeliveryStatus.Uncertain)
                } else {
                    it
                }
            },
        )
    }

    fun revoke() {
        suspend()
        access = null
        draftRevision++
        mutable.value = MessageState()
    }
}

private fun FeedEntry.confirms(access: MeetingAccess, pending: PendingMessage): Boolean =
    meetingId == access.id &&
        actor.id == access.profile.id &&
        clientRequestId == pending.key &&
        messageText == pending.text &&
        attachments.isEmpty()
