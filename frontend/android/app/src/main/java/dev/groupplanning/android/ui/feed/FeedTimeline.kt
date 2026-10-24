package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.data.api.models.UserProfile
import dev.groupplanning.android.state.feed.FeedState
import dev.groupplanning.android.state.feed.MessageState
import dev.groupplanning.android.ui.motion.LocalMotionEnabled
import dev.groupplanning.android.ui.theme.Palette
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
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 20.dp),
            verticalArrangement = Arrangement.spacedBy(22.dp),
        ) {
            if (pending != null) {
                item(key = "pending-${pending.key}") {
                    OutgoingMessage(messages, profile, retry, recover)
                }
            }
            items(state.entries.asReversed(), key = { it.id.toString() }) { entry ->
                val text = entry.messageText
                if (text != null) {
                    FeedMessage(
                        entry.actor,
                        entry.occurredAt,
                        text,
                        entry.actor.id == profile.id,
                        Modifier.testTag("feed-entry-${entry.sequence.value}"),
                    )
                } else if (entry.kind in listOf("date_poll_created", "place_poll_created") &&
                    entry.payloadVersion == 1
                ) {
                    poll(entry)
                } else {
                    FeedEvent(entry)
                }
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
