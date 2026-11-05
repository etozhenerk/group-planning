package dev.groupplanning.android.ui.savedinvitations

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun SavedInvitationsExplanation(modifier: Modifier = Modifier) {
    Text(
        stringResource(R.string.invitations_description),
        modifier,
        color = Palette.muted,
        fontSize = DesignTokens.typographySizeSmall,
        lineHeight =
        DesignTokens.typographySizeSmall *
            DesignTokens.componentMobileInvitationsExplanationLineHeight,
    )
}
