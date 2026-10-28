package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.layout.boundsInWindow
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.data.api.models.MeetingMedia
import dev.groupplanning.android.data.api.models.ServerCounter
import dev.groupplanning.android.data.api.models.UserProfile
import dev.groupplanning.android.data.repository.ChatViewport
import dev.groupplanning.android.state.feed.FeedState
import dev.groupplanning.android.state.feed.MessageState
import dev.groupplanning.android.state.feed.feedRows
import dev.groupplanning.android.ui.motion.LocalMotionEnabled
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale
import java.util.UUID
import kotlinx.coroutines.launch

@Composable
internal fun FeedTimeline(
    state: FeedState,
    messages: MessageState,
    profile: UserProfile,
    history: () -> Unit,
    retry: (UUID) -> Unit,
    recover: (UUID) -> Unit,
    poll: @Composable (FeedEntry) -> Unit,
    modifier: Modifier = Modifier,
    reaction: @Composable (FeedEntry, ReactionAnchor) -> Unit = { _, _ -> },
    openReaction: (FeedEntry) -> Unit = {},
    attachment: @Composable (MeetingMedia) -> Unit = {},
    visible: (List<UUID>) -> Unit = {},
    empty: @Composable () -> Unit = {},
    newer: () -> Unit = {},
    tail: () -> Unit = {},
    viewport: (ChatViewport) -> Unit = {},
    focused: (UUID?) -> Unit = {},
    receipt: @Composable (FeedEntry, ReactionAnchor) -> Unit = { _, _ -> },
    readVisible: (List<FeedEntry>, List<FeedEntry>, Boolean) -> Unit = { _, _, _ -> },
    readEligible: Boolean = false,
    bounds: Rect = Rect.Zero,
) {
    val rows = feedRows(state, messages, profile)
    val list = rememberLazyListState()
    val scope = rememberCoroutineScope()
    val motion = LocalMotionEnabled.current
    val position = remember { TimelinePosition() }
    var viewportBounds by remember { mutableStateOf(Rect.Zero) }
    val geometries = remember { mutableStateMapOf<UUID, Rect>() }
    var headingHeight by remember { mutableStateOf(0f) }
    val headingGap = with(LocalDensity.current) { DesignTokens.spaceS20.toPx() }
    FeedViewportEffect(list, rows, state, position, headingHeight, viewport)
    LaunchedEffect(
        list,
        rows,
        state.hasHistory,
        state.hasNewer,
        state.historyError,
        state.newerError,
        readEligible,
        bounds,
        viewportBounds,
    ) {
        snapshotFlow {
            Triple(
                list.layoutInfo.visibleItemsInfo,
                geometries.toMap(),
                position.ready && !position.adjusting,
            )
        }
            .collect { (items, rectangles, positioned) ->
                val keys = items.map { it.key }.toSet()
                visible(
                    rows.filter { it.key in keys }.mapNotNull { it.entry }
                        .filter { it.kind == "message" }.map { it.id },
                )
                val visibleEntries = rows.filter { it.key in keys }.mapNotNull { it.entry }
                val bottoms = visibleEntries.filter { entry ->
                    val rect = rectangles[entry.id]
                    rect != null &&
                        !rect.isEmpty &&
                        rect.bottom >= maxOf(bounds.top, viewportBounds.top) &&
                        rect.bottom <= minOf(bounds.bottom, viewportBounds.bottom)
                }
                readVisible(
                    visibleEntries,
                    bottoms,
                    readEligible && positioned && !position.adjusting,
                )
                val reach = items.size.coerceAtLeast(1) * 2
                if (items.any { it.index >= rows.size - reach } && !state.historyError) history()
                if (items.any { it.index < reach } && !state.newerError) newer()
            }
    }
    Column(modifier) {
        Box(Modifier.weight(1f).onGloballyPositioned { viewportBounds = it.boundsInWindow() }) {
            LazyColumn(
                Modifier.fillMaxSize().alpha(
                    if (position.ready ||
                        !state.ready
                    ) {
                        1f
                    } else {
                        0f
                    },
                ).testTag("feed-timeline"),
                state = list,
                reverseLayout = true,
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 18.dp),
                verticalArrangement = Arrangement.spacedBy(20.dp),
            ) {
                if (state.newerLoading || state.newerError) {
                    item(key = "newer-boundary") {
                        ChatBoundary(state.newerLoading, state.newerError, newer)
                    }
                }
                itemsIndexed(rows.asReversed(), key = { _, row -> row.key }) { index, row ->
                    val entry = row.entry
                    Column(verticalArrangement = Arrangement.spacedBy(20.dp)) {
                        val day = row.time.instant.atZone(ZoneId.systemDefault()).toLocalDate()
                        val previous = rows.getOrNull(rows.lastIndex - index - 1)
                            ?.time?.instant?.atZone(ZoneId.systemDefault())?.toLocalDate()
                        if (day != previous) {
                            Text(
                                if (day == LocalDate.now()) {
                                    stringResource(R.string.feed_today)
                                } else {
                                    day.format(
                                        DateTimeFormatter.ofPattern(
                                            "d MMMM",
                                            Locale.forLanguageTag("ru"),
                                        ),
                                    )
                                },
                                Modifier.fillMaxWidth().onGloballyPositioned {
                                    headingHeight = it.size.height + headingGap
                                },
                                fontSize = 11.sp,
                                lineHeight = 16.5.sp,
                                color = Palette.muted,
                                textAlign = TextAlign.Center,
                            )
                        }

                        if (entry?.id == state.divider && state.readEnabled) UnreadDivider()
                        if (row.text != null) {
                            FeedMessageRow(
                                row,
                                profile.id,
                                messages.draft.isEmpty(),
                                retry,
                                recover,
                                reaction,
                                openReaction,
                                attachment,
                                receipt,
                                focused,
                                { id, rect ->
                                    if (rect ==
                                        null
                                    ) {
                                        geometries.remove(id)
                                    } else {
                                        geometries[id] = rect
                                    }
                                },
                            )
                        } else if (entry != null &&
                            entry.kind in
                            listOf(
                                "date_poll_created",
                                "place_poll_created",
                                "preparation_task_created",
                            ) &&
                            entry.payloadVersion == 1
                        ) {
                            poll(entry)
                        } else if (entry != null) {
                            FeedEvent(entry)
                        }
                    }
                }
                if (state.ready && rows.none { it.text != null }) {
                    item(key = "invite-friends") { empty() }
                }
                if (state.hasHistory || state.historyLoading || state.historyError) {
                    item(key = "history") {
                        ChatBoundary(state.historyLoading, state.historyError, history)
                    }
                }
            }
            if (!state.ready && state.loading) {
                Column(Modifier.padding(DesignTokens.spaceS16)) {
                    repeat(3) { ChatBoundary(true, false, {}) }
                }
            }
        }

        if ((!position.following || state.hasNewer) && state.ready) {
            Row(
                Modifier.fillMaxWidth().padding(
                    horizontal = DesignTokens.spaceS16,
                    vertical = DesignTokens.spaceS8,
                ),
                horizontalArrangement = Arrangement.End,
            ) {
                TextButton(
                    {
                        position.following = true
                        position.movingToTail = true
                        tail()
                        scope.launch {
                            try {
                                if (motion) list.animateScrollToItem(0) else list.scrollToItem(0)
                            } finally {
                                position.movingToTail = false
                            }
                        }
                    },
                    Modifier.heightIn(min = DesignTokens.targetAndroid)
                        .background(
                            DesignTokens.colorRaised,
                            RoundedCornerShape(DesignTokens.radiusPill),
                        )
                        .testTag("feed-end"),
                ) {
                    val count = state.readInfo?.unread
                    Text(
                        if (count != null && count > ServerCounter.Zero) {
                            pluralStringResource(
                                R.plurals.chat_new_count,
                                count.value.takeLast(2).toInt(),
                                count.value,
                            )
                        } else {
                            stringResource(R.string.chat_tail)
                        },
                        color = DesignTokens.colorText,
                        fontSize = DesignTokens.typographySizeCaption,
                    )
                }
            }
        }
    }
}
