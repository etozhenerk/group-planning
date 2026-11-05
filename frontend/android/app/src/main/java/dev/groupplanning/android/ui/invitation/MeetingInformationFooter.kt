package dev.groupplanning.android.ui.invitation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import dev.groupplanning.android.R
import dev.groupplanning.android.state.InvitationState
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.components.CompactButton
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun MeetingInformationFooter(
    state: InvitationState,
    share: () -> Unit,
    respond: () -> Unit,
) {
    if (state.details?.organizer == true) {
        CompactButton(
            stringResource(R.string.invitation_share),
            Modifier.fillMaxWidth().testTag("information-share"),
            primary = true,
            click = share,
        )
    } else {
        Row(
            Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS12),
        ) {
            Text(
                "✓",
                Modifier.size(DesignTokens.componentMobileInfoResponseIconSize)
                    .background(
                        DesignTokens.colorBackground,
                        RoundedCornerShape(DesignTokens.spaceS12),
                    ),
                color = DesignTokens.colorAccent,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                lineHeight = with(androidx.compose.ui.platform.LocalDensity.current) {
                    DesignTokens.componentMobileInfoResponseIconSize.toSp()
                },
                fontSize = DesignTokens.typographySizeButton,
            )
            Column(Modifier.weight(1f)) {
                Text(
                    stringResource(R.string.participants_my_answer),
                    fontSize = DesignTokens.typographySizeLabel,
                    color = DesignTokens.colorMuted,
                )
                Text(
                    state.answer?.let { stringResource(it.label()) }
                        ?: stringResource(R.string.info_no_answer),
                    fontSize = DesignTokens.typographySizeSmall,
                    fontWeight = FontWeight.SemiBold,
                )
            }
            TextButton(respond, Modifier.testTag("information-change-answer")) {
                Text(
                    stringResource(R.string.info_change),
                    color = DesignTokens.colorAccent,
                    fontSize = DesignTokens.typographySizeCaption,
                )
                ChatIcon(
                    ChatSymbol.Down,
                    Modifier.size(DesignTokens.spaceS16),
                    tint = DesignTokens.colorAccent,
                )
            }
        }
    }
}
