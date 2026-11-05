package dev.groupplanning.android.ui.invitation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun InvitationUnavailable(retry: () -> Unit) {
    Column(
        Modifier.padding(top = DesignTokens.componentInvitationStateUnavailableTopGap)
            .fillMaxWidth().background(
                DesignTokens.colorSurface,
                RoundedCornerShape(DesignTokens.radiusCard),
            ).padding(
                horizontal = DesignTokens.componentInvitationStateUnavailableInsetInline,
                vertical = DesignTokens.componentInvitationStateUnavailableInsetBlock,
            ),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Box(
            Modifier.padding(bottom = DesignTokens.spaceS24)
                .size(DesignTokens.componentMobileStateIconSize).background(
                    DesignTokens.colorBackground,
                    RoundedCornerShape(DesignTokens.componentMobileStateIconRadius),
                ),
            contentAlignment = Alignment.Center,
        ) {
            ChatIcon(
                ChatSymbol.CloudOff,
                Modifier.size(DesignTokens.componentMobileStateGlyphSize),
                tint = DesignTokens.colorAccent,
                strokeWidth = DesignTokens.componentMobileStateGlyphStroke,
            )
        }
        Text(
            stringResource(R.string.invitation_unavailable),
            Modifier.padding(bottom = DesignTokens.componentMobileInvitationTitleGap)
                .semantics { heading() },
            fontSize = DesignTokens.componentInvitationStateUnavailableTitleSize.value.sp,
            lineHeight = DesignTokens.componentInvitationStateUnavailableTitleSize.value.sp *
                DesignTokens.componentActionHeadingLineHeight,
            fontWeight = FontWeight(DesignTokens.componentMobileInvitationTitleWeight.toInt()),
            textAlign = TextAlign.Center,
        )
        InformationAction(
            stringResource(R.string.invitation_reload),
            retry,
            Modifier.fillMaxWidth(),
            primary = true,
            small = true,
        )
    }
}
