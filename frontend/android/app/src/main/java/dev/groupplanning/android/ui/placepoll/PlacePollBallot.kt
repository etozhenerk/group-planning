package dev.groupplanning.android.ui.placepoll

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import dev.groupplanning.android.state.placepoll.PlacePollState
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun PlacePollBallot(state: PlacePollState, vote: (String) -> Unit) {
    if (LocalDensity.current.fontScale >= 1.5f) {
        Column(
            Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8),
        ) {
            PlaceVoteButton(state, "for", vote, Modifier.fillMaxWidth())
            PlaceVoteButton(state, "against", vote, Modifier.fillMaxWidth())
        }
    } else {
        Row(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8),
        ) {
            PlaceVoteButton(state, "for", vote, Modifier.weight(1f))
            PlaceVoteButton(state, "against", vote, Modifier.weight(1f))
        }
    }
}
