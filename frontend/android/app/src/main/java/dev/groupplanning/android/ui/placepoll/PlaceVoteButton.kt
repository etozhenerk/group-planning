package dev.groupplanning.android.ui.placepoll

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import dev.groupplanning.android.R
import dev.groupplanning.android.state.placepoll.PlacePollState
import dev.groupplanning.android.ui.theme.DesignTokens
import java.time.Instant

@Composable
internal fun PlaceVoteButton(
    state: PlacePollState,
    answer: String,
    vote: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val poll = state.poll ?: return
    val label = stringResource(
        if (answer == "for") R.string.place_poll_for else R.string.place_poll_against,
    )
    val count = if (answer == "for") poll.votesFor else poll.votesAgainst
    val text = stringResource(R.string.place_poll_count, label, count)
    val pendingLabel = stringResource(R.string.place_poll_saving)
    val ownLabel = stringResource(R.string.place_poll_own, label)
    val canVote = poll.canVote && poll.closesAt.instant.isAfter(Instant.now())
    val selected = poll.myVote == answer
    val busy = state.busy && state.sendingAnswer == answer
    Surface(
        { vote(answer) },
        modifier.heightIn(min = DesignTokens.targetAndroid)
            .then(if (canVote) Modifier.testTag("place-vote-$answer") else Modifier)
            .semantics {
                this.selected = selected
                contentDescription = text
                if (busy) {
                    stateDescription = pendingLabel
                } else if (selected) {
                    stateDescription =
                        ownLabel
                }
            },
        enabled = canVote && state.editable,
        shape = RoundedCornerShape(DesignTokens.componentMobileChatInlineVoteRadius),
        color = DesignTokens.colorRaised,
        contentColor = DesignTokens.colorText,
        border = BorderStroke(
            DesignTokens.spaceS1,
            if (selected) DesignTokens.colorAccent else DesignTokens.colorBorderStrong,
        ),
    ) {
        Row(
            Modifier.padding(
                horizontal = DesignTokens.componentMobileChatInlineVoteInsetInline,
                vertical = DesignTokens.componentMobileChatInlineVoteInsetBlock,
            ),
            horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                label,
                Modifier.weight(1f),
                fontSize = DesignTokens.typographySizeSmall,
                lineHeight =
                DesignTokens.typographySizeSmall * DesignTokens.typographyLineHeightBody,
            )
            if (busy) {
                CircularProgressIndicator(
                    Modifier.size(DesignTokens.componentButtonIconSize),
                    color = DesignTokens.colorAccent,
                    strokeWidth = DesignTokens.spaceS2,
                )
            } else {
                Text(
                    count.toString(),
                    color = DesignTokens.colorMuted,
                    fontSize = DesignTokens.typographySizeSmall,
                    lineHeight =
                    DesignTokens.typographySizeSmall * DesignTokens.typographyLineHeightBody,
                )
            }
        }
    }
}
