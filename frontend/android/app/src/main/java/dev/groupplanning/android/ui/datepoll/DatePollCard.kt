package dev.groupplanning.android.ui.datepoll

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.colorResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.data.api.models.Meeting
import dev.groupplanning.android.state.datepoll.DatePollState
import dev.groupplanning.android.ui.components.meetingTime
import dev.groupplanning.android.ui.feed.FeedAvatar
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun DatePollCard(
    state: DatePollState,
    meeting: Meeting,
    entry: FeedEntry,
    own: Boolean,
    actions: DatePollActions,
) {
    Row(
        Modifier.fillMaxWidth().padding(
            start = if (own) 28.dp else 0.dp,
            end = if (own) 0.dp else 28.dp,
        ),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        if (!own) FeedAvatar(entry.actor.displayName)
        CompositionLocalProvider(
            LocalContentColor provides if (own) Palette.actionText else Palette.text,
        ) {
            Column(
                Modifier.weight(1f).background(
                    if (own) colorResource(R.color.own_message) else Palette.message,
                    RoundedCornerShape(
                        topStart = if (own) 20.dp else 6.dp,
                        topEnd = if (own) 6.dp else 20.dp,
                        bottomStart = 20.dp,
                        bottomEnd = 20.dp,
                    ),
                ).padding(16.dp).testTag("date-poll-${state.poll?.id}"),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Text(
                    if (own) stringResource(R.string.feed_you) else entry.actor.displayName,
                    fontWeight = FontWeight.SemiBold,
                )
                Text(stringResource(R.string.poll_title), fontWeight = FontWeight.Bold)
                val poll = state.poll
                if (poll != null) {
                    DatePollBallot(state, actions)
                    if (poll.canResolve) {
                        DatePollResolution(
                            poll,
                            meeting.timezone,
                            state.editable,
                            actions.resolve,
                        )
                    }
                    val status = when (poll.state) {
                        "applied" -> R.string.poll_applied
                        "no_majority" -> R.string.poll_no_majority
                        "cancelled" -> R.string.poll_finished
                        "awaiting_choice" -> R.string.poll_awaiting_choice
                        "awaiting_time" -> R.string.poll_awaiting_time
                        "open" -> null
                        else -> R.string.feed_unknown
                    }
                    Text(
                        status?.let { stringResource(it) }
                            ?: stringResource(
                                R.string.poll_until,
                                meetingTime(poll.closesAt, meeting.timezone),
                            ),
                    )
                    if (poll.settings.anonymous) Text(stringResource(R.string.poll_anonymous))
                    if (poll.state == "open" && poll.settings.hideResults) {
                        Text(stringResource(R.string.poll_results_later))
                    }
                } else if (state.issue == null) {
                    CircularProgressIndicator()
                }
                state.issue?.let {
                    Text(pollIssueText(it), modifier = Modifier.testTag("poll-error"))
                }
                if (state.pending != null || state.poll == null && state.issue != null) {
                    TextButton(
                        actions.retry,
                        enabled = !state.busy,
                        colors = ButtonDefaults.textButtonColors(
                            contentColor = LocalContentColor.current,
                        ),
                    ) {
                        Text(stringResource(R.string.poll_retry))
                    }
                }
            }
        }
        if (own) FeedAvatar(entry.actor.displayName)
    }
}
