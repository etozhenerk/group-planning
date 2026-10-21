package dev.groupplanning.android.state.feed

import dev.groupplanning.android.data.outbox.PendingMessage

internal data class MessageState(
    val draft: String = "",
    val pending: PendingMessage? = null,
    val ready: Boolean = false,
    val sending: Boolean = false,
    val storageError: Boolean = false,
) {
    val canSend: Boolean get() = ready &&
        !sending &&
        pending == null &&
        draft.trim().let { it.codePointCount(0, it.length) in 1..4000 }
}
