package dev.groupplanning.android.state.feed

import dev.groupplanning.android.data.outbox.DeliveryStatus
import dev.groupplanning.android.data.outbox.PendingMessage

internal data class MessageState(
    val draft: String = "",
    val queue: List<PendingMessage> = emptyList(),
    val ready: Boolean = false,
    val saving: Boolean = false,
    val recovering: Boolean = false,
    val storageError: Boolean = false,
) {
    val pending: PendingMessage? get() = queue.firstOrNull()
    val sending: Boolean get() = queue.any { it.status == DeliveryStatus.Sending }
    val canSend: Boolean get() = ready &&
        !saving &&
        draft.trim().let { it.codePointCount(0, it.length) in 1..4000 }
}
