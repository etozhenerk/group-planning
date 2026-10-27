package dev.groupplanning.android.ui.datepoll

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.data.api.models.Meeting
import dev.groupplanning.android.state.datepoll.DatePollState
import dev.groupplanning.android.ui.components.ChatCardEyebrow
import dev.groupplanning.android.ui.components.ChatInlineCard
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.components.meetingTime
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun DatePollCard(
    state: DatePollState,
    meeting: Meeting,
    entry: FeedEntry,
    actions: DatePollActions,
) {
    ChatInlineCard(Modifier.testTag("date-poll-${state.poll?.id}")) {
        ChatCardEyebrow(entry, ChatSymbol.Calendar)
        Text(
            stringResource(R.string.poll_title),
            fontWeight = FontWeight(DesignTokens.typographyWeightSemibold.toInt()),
            fontSize = DesignTokens.typographySizeBody,
            lineHeight = DesignTokens.typographySizeBody * DesignTokens.typographyLineHeightBody,
        )
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
                Modifier.padding(
                    top = (DesignTokens.componentMobileChatInlineFootGap - DesignTokens.spaceS8)
                        .coerceAtLeast(DesignTokens.spaceS0),
                ),
                color = DesignTokens.colorMuted,
                fontSize = DesignTokens.typographySizeLabel,
                lineHeight =
                DesignTokens.typographySizeLabel * DesignTokens.typographyLineHeightLabel,
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
