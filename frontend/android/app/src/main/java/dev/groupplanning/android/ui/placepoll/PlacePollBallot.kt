package dev.groupplanning.android.ui.placepoll

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.size
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.R
import dev.groupplanning.android.state.placepoll.PlacePollState
import java.time.Instant

@Composable
internal fun PlacePollBallot(state: PlacePollState, vote: (String) -> Unit) {
    if (LocalDensity.current.fontScale >= 1.5f) {
        Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            PlaceVoteButton(state, "for", vote, Modifier.fillMaxWidth())
            PlaceVoteButton(state, "against", vote, Modifier.fillMaxWidth())
        }
    } else {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            PlaceVoteButton(state, "for", vote, Modifier.weight(1f))
            PlaceVoteButton(state, "against", vote, Modifier.weight(1f))
        }
    }
    state.poll?.myVote?.let {
        Text(
            stringResource(
                R.string.place_poll_own,
                stringResource(
                    if (it ==
                        "for"
                    ) {
                        R.string.place_poll_for
                    } else {
                        R.string.place_poll_against
                    },
                ),
            ),
        )
    }
}

@Composable
private fun PlaceVoteButton(
    state: PlacePollState,
    answer: String,
    vote: (String) -> Unit,
    modifier: Modifier,
) {
    val poll = state.poll ?: return
    val label = stringResource(
        if (answer ==
            "for"
        ) {
            R.string.place_poll_for
        } else {
            R.string.place_poll_against
        },
    )
    val text = stringResource(
        R.string.place_poll_count,
        label,
        if (answer ==
            "for"
        ) {
            poll.votesFor
        } else {
            poll.votesAgainst
        },
    )
    val pendingLabel = stringResource(R.string.place_poll_saving)
    if (poll.canVote && poll.closesAt.instant.isAfter(Instant.now())) {
        OutlinedButton(
            {
                vote(answer)
            },
            modifier.heightIn(min = 44.dp).testTag("place-vote-$answer").semantics {
                selected = poll.myVote == answer
                contentDescription = text
                if (state.busy && state.sendingAnswer == answer) stateDescription = pendingLabel
            },
            enabled = state.editable,
            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 10.dp),
            colors = ButtonDefaults.outlinedButtonColors(
                contentColor = LocalContentColor.current,
                containerColor = LocalContentColor.current.copy(
                    alpha = if (poll.myVote ==
                        answer
                    ) {
                        0.14f
                    } else {
                        0.02f
                    },
                ),
                disabledContentColor = LocalContentColor.current.copy(alpha = 0.5f),
            ),
        ) {
            if (state.busy &&
                state.sendingAnswer == answer
            ) {
                CircularProgressIndicator(
                    Modifier.size(20.dp),
                    color = LocalContentColor.current,
                    strokeWidth = 2.dp,
                )
            } else {
                Text(text)
            }
        }
    } else {
        Text(text, modifier.heightIn(min = 44.dp))
    }
}
