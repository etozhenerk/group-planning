package dev.groupplanning.android.ui.invitation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.RsvpAnswer
import dev.groupplanning.android.state.InvitationState
import dev.groupplanning.android.ui.components.ActionButton
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun RsvpForm(
    state: InvitationState,
    authenticated: Boolean,
    respond: (RsvpAnswer) -> Unit,
    authenticating: Boolean = false,
    signIn: () -> Unit = {},
) {
    Column(verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS12)) {
        if (authenticated) {
            if (!state.joinClosed || state.pending != null) {
                RsvpAction(state, RsvpAnswer.Going, respond, Modifier.fillMaxWidth())
                Row(horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8)) {
                    RsvpAction(state, RsvpAnswer.Maybe, respond, Modifier.weight(1f))
                    RsvpAction(state, RsvpAnswer.NotGoing, respond, Modifier.weight(1f))
                }
            }
            Text(
                stringResource(if (state.saving) R.string.rsvp_saving else R.string.rsvp_chat_hint),
                Modifier.semantics { liveRegion = LiveRegionMode.Polite },
                color = if (state.saving) DesignTokens.colorText else DesignTokens.colorMuted,
                fontSize = DesignTokens.typographySizeCaption,
                lineHeight =
                DesignTokens.typographySizeCaption * DesignTokens.typographyLineHeightBody,
            )
        } else {
            Text(
                stringResource(R.string.invitation_login_hint),
                color = DesignTokens.colorMuted,
                fontSize = DesignTokens.typographySizeCaption,
                lineHeight =
                DesignTokens.typographySizeCaption * DesignTokens.typographyLineHeightBody,
            )
            ActionButton(
                stringResource(R.string.invitation_login),
                busy = authenticating,
                onClick = signIn,
            )
        }
    }
}
