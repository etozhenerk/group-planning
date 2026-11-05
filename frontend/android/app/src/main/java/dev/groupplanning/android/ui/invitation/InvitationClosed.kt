package dev.groupplanning.android.ui.invitation

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.RsvpAnswer
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun InvitationClosed(answer: RsvpAnswer?) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(DesignTokens.radiusCover),
        color = DesignTokens.colorSurface,
        border = BorderStroke(DesignTokens.spaceS1, DesignTokens.colorLine),
    ) {
        Row(
            Modifier.padding(DesignTokens.spaceS16),
            horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS12),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                Modifier.size(DesignTokens.componentMobileCalendarSelectionSize).background(
                    DesignTokens.colorBackground,
                    RoundedCornerShape(DesignTokens.componentMobileInvitationClosedIconRadius),
                ),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    painterResource(R.drawable.ic_lock),
                    null,
                    Modifier.size(DesignTokens.componentMobileInvitationClosedGlyph),
                    tint = DesignTokens.colorMuted,
                )
            }
            Column(
                verticalArrangement = Arrangement.spacedBy(
                    DesignTokens.componentMobileInvitationClosedCopyGap,
                ),
            ) {
                Text(
                    stringResource(R.string.invitation_closed),
                    fontSize = DesignTokens.typographySizeSmall,
                    fontWeight = FontWeight(DesignTokens.typographyWeightSemibold.toInt()),
                )
                Text(
                    answer?.let {
                        stringResource(
                            R.string.invitation_closed_answer,
                            stringResource(it.label()),
                        )
                    }
                        ?: stringResource(R.string.invitation_closed_body),
                    fontSize = DesignTokens.typographySizeCaption,
                    lineHeight =
                    DesignTokens.typographySizeCaption * DesignTokens.typographyLineHeightBody,
                    color = DesignTokens.colorMuted,
                )
            }
        }
    }
}
