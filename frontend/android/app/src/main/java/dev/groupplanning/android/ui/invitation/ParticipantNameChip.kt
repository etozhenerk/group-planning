package dev.groupplanning.android.ui.invitation

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import dev.groupplanning.android.data.api.models.UserProfile
import dev.groupplanning.android.ui.components.UserAvatar
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun ParticipantNameChip(user: UserProfile, color: Color, information: Boolean = false) {
    val shape =
        RoundedCornerShape(
            if (information) {
                DesignTokens.componentMobileInfoCompanyChipRadius
            } else {
                DesignTokens.componentParticipantChipRadius
            },
        )
    val avatarSize = if (information) {
        DesignTokens.componentParticipantChipAvatarSize
    } else {
        with(LocalDensity.current) {
            maxOf(
                DesignTokens.componentMobilePeopleChipAvatarSize,
                (
                    DesignTokens.typographySizeMobilePeopleInitial *
                        DesignTokens.typographyLineHeightBody
                    ).toDp(),
            )
        }
    }
    Row(
        Modifier.testTag("participant-name-chip").heightIn(
            min = if (information) {
                DesignTokens.componentMobileInfoCompanyChipHeight
            } else {
                DesignTokens.componentParticipantChipHeight
            },
        ).clip(shape).background(color)
            .border(
                if (information) DesignTokens.spaceS0 else DesignTokens.spaceS2,
                DesignTokens.colorSurface,
                shape,
            ).padding(
                start = if (information) {
                    DesignTokens.componentMobileInfoCompanyChipInsetStart
                } else {
                    DesignTokens.componentMobilePeopleChipInsetStart
                },
                end = if (information) {
                    DesignTokens.componentMobileInfoCompanyChipInsetEnd
                } else {
                    DesignTokens.componentMobilePeopleChipInsetEnd
                },
                top = if (information) {
                    DesignTokens.componentMobileInfoCompanyChipInsetBlock
                } else {
                    DesignTokens.componentMobilePeopleChipInsetBlock
                },
                bottom = if (information) {
                    DesignTokens.componentMobileInfoCompanyChipInsetBlock
                } else {
                    DesignTokens.componentMobilePeopleChipInsetBlock
                },
            ),
        horizontalArrangement = Arrangement.spacedBy(
            DesignTokens.componentMobilePeopleChipGap,
        ),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        UserAvatar(
            user.displayName,
            user.avatarUrl,
            size = avatarSize,
            avatarColor = DesignTokens.colorParticipantChipAvatar,
            foregroundColor = DesignTokens.colorParticipantChipText,
        )
        Text(
            user.displayName,
            color = DesignTokens.colorParticipantChipText,
            fontSize = DesignTokens.typographySizeParticipantChip,
            lineHeight = DesignTokens.typographySizeParticipantChip *
                DesignTokens.typographyLineHeightBody,
        )
    }
}
