package dev.groupplanning.android.ui.feed

import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.platform.testTag
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.data.api.models.MeetingMedia
import dev.groupplanning.android.state.feed.FeedRow
import java.util.UUID

@Composable
internal fun FeedMessageRow(
    row: FeedRow,
    profileId: UUID,
    canRecover: Boolean,
    retry: (UUID) -> Unit,
    recover: (UUID) -> Unit,
    reaction: @Composable (FeedEntry, ReactionAnchor) -> Unit,
    openReaction: (FeedEntry) -> Unit,
    attachment: @Composable (MeetingMedia, Boolean) -> Unit,
    receipt: @Composable (FeedEntry, ReactionAnchor) -> Unit = { _, _ -> },
    focused: (UUID?) -> Unit = {},
    geometry: (UUID, Rect?) -> Unit = { _, _ -> },
) {
    val presentation = LocalChatPresentation.current
    val entry = row.entry
    val pending = row.pending
    val anchor = remember(row.key) { ReactionAnchor() }
    var hadFocus by remember(row.key) { mutableStateOf(false) }
    LaunchedEffect(entry?.id, anchor.contentBounds) {
        entry?.let { geometry(it.id, anchor.contentBounds) }
    }
    DisposableEffect(entry?.id) { onDispose { entry?.let { geometry(it.id, null) } } }
    FeedMessage(
        row.author, row.time, row.text.orEmpty(), row.author.id == profileId,
        Modifier.testTag(entry?.let { "feed-entry-${it.sequence.value}" } ?: "message-pending")
            .onFocusChanged {
                if (it.hasFocus || hadFocus) focused(entry?.id.takeIf { _ -> it.hasFocus })
                hadFocus = it.hasFocus
            },
        react = entry?.let { { openReaction(it) } },
        highlighted = entry != null && presentation.reaction == entry.id,
        reactionAnchor = anchor,
        delivery = {
            if (pending != null) {
                PendingMessageIndicator(pending)
            } else if (entry != null && entry.actor.id == profileId) {
                receipt(entry, anchor)
            }
        },
        footer = { if (entry != null) reaction(entry, anchor) },
        failure = {
            if (pending?.rejected ==
                true
            ) {
                OutgoingStatus(pending, canRecover, {
                    retry(pending.key)
                }, { recover(pending.key) })
            }
        },
        status = {
            if (pending != null && !pending.rejected) {
                OutgoingStatus(pending, canRecover, {
                    retry(pending.key)
                }, { recover(pending.key) })
            }
        },
        body = entry?.attachments?.takeIf { it.isNotEmpty() }?.let { media ->
            { media.forEach { attachment(it, row.author.id == profileId) } }
        },
    )
}
