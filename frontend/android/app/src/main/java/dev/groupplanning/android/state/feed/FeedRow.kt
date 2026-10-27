package dev.groupplanning.android.state.feed

import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.data.api.models.UserProfile
import dev.groupplanning.android.data.outbox.PendingMessage

internal data class FeedRow(
    val key: String,
    val author: UserProfile,
    val entry: FeedEntry? = null,
    val pending: PendingMessage? = null,
) {
    val time get() = entry?.occurredAt ?: checkNotNull(pending).createdAt
    val text get() = entry?.messageText ?: pending?.text
}

internal fun feedRows(
    state: FeedState,
    messages: MessageState,
    profile: UserProfile,
): List<FeedRow> {
    val confirmed = state.entries.map { entry ->
        val intent = messages.queue.find { it.key == entry.clientRequestId }
        val collision = intent != null &&
            (entry.messageText != intent.text || entry.attachments.isNotEmpty())
        val key = if (entry.actor.id == profile.id && entry.clientRequestId != null && !collision) {
            "${profile.id}:${entry.clientRequestId}"
        } else {
            entry.id.toString()
        }
        FeedRow(key, entry.actor, entry = entry)
    }
    val keys = confirmed.map { it.key }.toSet()
    val pending = messages.queue.map { FeedRow("${profile.id}:${it.key}", profile, pending = it) }
        .filterNot { it.key in keys }
    return confirmed + pending
}
