package dev.groupplanning.android.ui.placepoll

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.data.api.models.Meeting
import dev.groupplanning.android.state.placepoll.PlacePollState
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatInlineCard
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.components.UserAvatar
import dev.groupplanning.android.ui.theme.DesignTokens
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@Composable
internal fun PlacePollCard(
    state: PlacePollState,
    meeting: Meeting,
    entry: FeedEntry,
    vote: (String) -> Unit,
    retry: () -> Unit,
) {
    ChatInlineCard(
        Modifier.testTag("place-poll-${state.poll?.id}"),
        inset = DesignTokens.spaceS16,
        radius = DesignTokens.componentMobileDecisionCardRadius,
        gap = DesignTokens.spaceS0,
    ) {
        Row(
            Modifier.fillMaxWidth().padding(bottom = DesignTokens.componentMobileFormSectionGap),
            horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            UserAvatar(
                entry.actor.displayName,
                entry.actor.avatarUrl,
                size = DesignTokens.componentMobileAvatarSmallSize,
            )
            Text(
                entry.actor.displayName,
                Modifier.weight(1f),
                fontSize = DesignTokens.typographySizeCaption,
            )
            Text(
                entry.occurredAt.instant.atZone(
                    ZoneId.systemDefault(),
                ).format(DateTimeFormatter.ofPattern("HH:mm")),
                fontSize = DesignTokens.typographySizeLabel,
                color = DesignTokens.colorMuted,
            )
        }
        Row(
            horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS6),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            ChatIcon(
                ChatSymbol.Pin,
                Modifier.size(DesignTokens.componentMobileCreationHintIconSize),
            )
            Text(
                stringResource(R.string.place_poll_caption),
                fontSize = DesignTokens.typographySizeLabel,
                color = DesignTokens.colorMuted,
            )
        }
        val poll = state.poll
        if (poll != null) {
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
            if (poll.state != "open") {
                Text(
                    stringResource(status ?: R.string.place_poll_finished),
                    Modifier.padding(top = DesignTokens.componentMobileFormSectionGap),
                    color = DesignTokens.colorAccent,
                    fontSize = DesignTokens.typographySizeCaption,
                )
            }
            Column(
                verticalArrangement = Arrangement.spacedBy(
                    DesignTokens.spaceS8,
                ),
            ) {
                Text(
                    poll.place,
                    Modifier.padding(top = DesignTokens.spaceS12),
                    fontWeight = FontWeight.Bold,
                    fontSize = DesignTokens.componentMobileDecisionCardTitleSize.value.sp,
                    lineHeight = DesignTokens.componentMobileDecisionCardTitleLineHeight.value.sp,
                )
                poll.explanation?.takeIf(String::isNotBlank)?.let {
                    Text(
                        it,
                        Modifier.padding(bottom = DesignTokens.spaceS20),
                        color = DesignTokens.colorMuted,
                        fontSize = DesignTokens.typographySizeSmall,
                        lineHeight =
                        DesignTokens.typographySizeSmall * DesignTokens.typographyLineHeightBody,
                    )
                }
            }
            PlacePollBallot(state, vote)
            PlacePollFooter(poll, meeting, status)
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
