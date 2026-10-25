package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.data.api.models.MeetingMedia
import dev.groupplanning.android.data.api.models.UserProfile
import dev.groupplanning.android.state.feed.FeedState
import dev.groupplanning.android.state.feed.MessageState
import dev.groupplanning.android.ui.motion.LocalMotionEnabled
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
    retry: () -> Unit,
    recover: () -> Unit,
    poll: @Composable (FeedEntry) -> Unit,
    modifier: Modifier = Modifier,
    reaction: @Composable (FeedEntry) -> Unit = {},
    openReaction: (FeedEntry) -> Unit = {},
    attachment: @Composable (MeetingMedia) -> Unit = {},
    visible: (List<UUID>) -> Unit = {},
    empty: @Composable () -> Unit = {},
) {
    val list = rememberLazyListState()
    val scope = rememberCoroutineScope()
    val motion = LocalMotionEnabled.current
    var following by remember { mutableStateOf(true) }
    LaunchedEffect(list) {
        snapshotFlow { !list.canScrollBackward }.collect { following = it }
    }
    LaunchedEffect(state.entries.lastOrNull()?.id, messages.pending?.key) {
        if (following) list.scrollToItem(0)
    }
    LaunchedEffect(list, state.entries) {
        snapshotFlow {
            list.layoutInfo.visibleItemsInfo.mapNotNull { it.key as? String }
        }.collect { keys ->
            visible(
                state.entries.filter {
                    it.id.toString() in keys && it.kind == "message"
                }.map { it.id },
            )
        }
    }
    val pending = messages.pending?.takeUnless { outgoing ->
        state.entries.any {
            it.actor.id == profile.id && it.clientRequestId == outgoing.key
        }
    }
    Box(modifier) {
        LazyColumn(
            Modifier.fillMaxSize().testTag("feed-timeline"),
            state = list,
            reverseLayout = true,
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 18.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {
            if (pending != null) {
                item(key = "pending-${pending.key}") {
                    OutgoingMessage(messages, profile, retry, recover)
                }
            }
            itemsIndexed(state.entries.asReversed(), key = { _, item -> item.id.toString() }) {
                    index,
                    entry,
                ->
                Column(verticalArrangement = Arrangement.spacedBy(20.dp)) {
                    val day = entry.occurredAt.instant.atZone(ZoneId.systemDefault()).toLocalDate()
                    val previous = state.entries.getOrNull(state.entries.lastIndex - index - 1)
                        ?.occurredAt?.instant?.atZone(ZoneId.systemDefault())?.toLocalDate()
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
                            Modifier.fillMaxWidth(),
                            fontSize = 11.sp,
                            lineHeight = 16.5.sp,
                            color = Palette.muted,
                            textAlign = TextAlign.Center,
                        )
                    }

                    val text = entry.messageText
                    if (text != null) {
                        Column {
                            FeedMessage(
                                entry.actor,
                                entry.occurredAt,
                                text,
                                entry.actor.id == profile.id,
                                Modifier.testTag("feed-entry-${entry.sequence.value}"),
                                react = { openReaction(entry) },
                                status = { reaction(entry) },
                                body = if (entry.attachments.isEmpty()) {
                                    null
                                } else {
                                    { entry.attachments.forEach { attachment(it) } }
                                },
                            )
                        }
                    } else if (entry.kind in
                        listOf(
                            "date_poll_created",
                            "place_poll_created",
                            "preparation_task_created",
                        ) &&
                        entry.payloadVersion == 1
                    ) {
                        poll(entry)
                    } else {
                        FeedEvent(entry)
                    }
                }
            }
            if (state.ready && state.entries.none { it.kind == "message" }) {
                item(key = "invite-friends") { empty() }
            }
            if (state.hasHistory) {
                item(key = "history") {
                    TextButton(
                        history,
                        enabled = !state.historyLoading,
                        modifier = Modifier.testTag("feed-history"),
                    ) {
                        Text(
                            stringResource(
                                if (state.historyLoading) {
                                    R.string.feed_loading
                                } else if (state.historyError) {
                                    R.string.feed_history_retry
                                } else {
                                    R.string.feed_history
                                },
                            ),
                        )
                    }
                }
            }
        }
        if (!following) {
            TextButton(
                {
                    scope.launch {
                        if (motion) list.animateScrollToItem(0) else list.scrollToItem(0)
                    }
                },
                Modifier.align(Alignment.BottomCenter).testTag("feed-end"),
            ) {
                Text(stringResource(R.string.feed_new), color = Palette.accent)
            }
        }
        if (!state.ready && state.loading) {
            CircularProgressIndicator(Modifier.align(Alignment.Center))
        }
    }
}
