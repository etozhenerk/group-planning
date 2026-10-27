package dev.groupplanning.android.ui.placepoll

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ButtonDefaults
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
import dev.groupplanning.android.state.placepoll.PlacePollState
import dev.groupplanning.android.ui.components.ChatCardEyebrow
import dev.groupplanning.android.ui.components.ChatInlineCard
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.components.meetingTime
import dev.groupplanning.android.ui.theme.DesignTokens
import java.time.Instant

@Composable
internal fun PlacePollCard(
    state: PlacePollState,
    meeting: Meeting,
    entry: FeedEntry,
    vote: (String) -> Unit,
    retry: () -> Unit,
) {
    ChatInlineCard(Modifier.testTag("place-poll-${state.poll?.id}")) {
        ChatCardEyebrow(entry, ChatSymbol.Pin)
        val poll = state.poll
        if (poll != null) {
            Column(
                verticalArrangement = Arrangement.spacedBy(
                    DesignTokens.componentMobileChatInlineTitleAfterGap,
                ),
            ) {
                Text(
                    poll.place,
                    fontWeight = FontWeight(DesignTokens.typographyWeightSemibold.toInt()),
                    fontSize = DesignTokens.typographySizeBody,
                    lineHeight = DesignTokens.typographySizeBody *
                        DesignTokens.typographyLineHeightBody,
                )
                poll.explanation?.takeIf(String::isNotBlank)?.let {
                    Text(
                        it,
                        color = DesignTokens.colorMuted,
                        fontSize = DesignTokens.typographySizeSmall,
                        lineHeight =
                        DesignTokens.typographySizeSmall * DesignTokens.typographyLineHeightBody,
                    )
                }
            }
            PlacePollBallot(state, vote)
            val status = when (poll.state) {
                "applied" -> R.string.place_poll_applied
                "rejected" -> R.string.place_poll_unchanged_result
                "cancelled" -> R.string.place_poll_cancelled
                "open" -> if (!poll.canVote ||
                    !poll.closesAt.instant.isAfter(Instant.now())
                ) {
                    R.string.place_poll_finished
                } else {
                    null
                }
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
                ).testTag("place-poll-status"),
                color = DesignTokens.colorMuted,
                fontSize = DesignTokens.typographySizeLabel,
                lineHeight =
                DesignTokens.typographySizeLabel * DesignTokens.typographyLineHeightLabel,
            )
        } else if (state.issue == null) {
            PlacePollLoading()
        }
        state.issue?.let {
            Text(placeIssueText(it), modifier = Modifier.testTag("place-poll-error"))
        }
        if (state.pending != null || state.poll == null && state.issue != null) {
            TextButton(
                retry,
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
