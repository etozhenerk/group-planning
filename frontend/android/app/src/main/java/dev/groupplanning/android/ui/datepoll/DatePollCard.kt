package dev.groupplanning.android.ui.datepoll

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.data.api.models.Meeting
import dev.groupplanning.android.state.datepoll.DatePollState
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.components.MobileDecisionCard
import dev.groupplanning.android.ui.components.meetingTime
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun DatePollCard(
    state: DatePollState,
    meeting: Meeting,
    entry: FeedEntry,
    actions: DatePollActions,
) {
    MobileDecisionCard(entry, Modifier.testTag("date-poll-${state.poll?.id}")) {
        Row(horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8)) {
            ChatIcon(ChatSymbol.Calendar, Modifier.size(DesignTokens.componentMobileFieldIconSize))
            Text(
                stringResource(R.string.chat_poll_badge),
                fontSize = DesignTokens.typographySizeLabel,
                color = DesignTokens.colorMuted,
            )
        }
        Text(
            stringResource(R.string.poll_card_question),
            Modifier.padding(top = DesignTokens.spaceS10, bottom = DesignTokens.spaceS8),
            fontWeight = FontWeight.Bold,
            fontSize = DesignTokens.componentMobileDecisionCardTitleSize.value.sp,
            lineHeight = DesignTokens.componentMobileDecisionCardTitleLineHeight.value.sp,
        )
        val poll = state.poll
        if (poll != null) {
            Text(
                stringResource(
                    if (poll.settings.multipleAnswers) {
                        R.string.poll_multiple_hint
                    } else {
                        R.string.poll_single_hint
                    },
                ),
                Modifier.padding(bottom = DesignTokens.componentMobileFormSectionGap),
                fontSize = DesignTokens.typographySizeCaption,
                color = DesignTokens.colorMuted,
            )
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
            Row(
                Modifier.fillMaxWidth().padding(top = DesignTokens.componentMobileFormSectionGap),
                horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS12),
                verticalAlignment = Alignment.Top,
            ) {
                Text(
                    status?.let { stringResource(it) } ?: stringResource(
                        R.string.poll_until,
                        meetingTime(poll.closesAt, meeting.timezone),
                    ),
                    Modifier.weight(1f),
                    color = DesignTokens.colorMuted,
                    fontSize = DesignTokens.typographySizeLabel,
                )
                Text(
                    stringResource(
                        if (poll.settings.anonymous) {
                            R.string.poll_anonymous
                        } else {
                            R.string.poll_nonanonymous
                        },
                    ),
                    Modifier.weight(1f),
                    textAlign = TextAlign.End,
                    fontSize = DesignTokens.typographySizeLabel,
                    color = DesignTokens.colorMuted,
                )
            }
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
