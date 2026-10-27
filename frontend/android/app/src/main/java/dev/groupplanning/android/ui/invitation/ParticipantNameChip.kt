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
import androidx.compose.ui.text.font.FontWeight
import dev.groupplanning.android.data.api.models.UserProfile
import dev.groupplanning.android.ui.components.UserAvatar
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun ParticipantNameChip(user: UserProfile, color: Color) {
    val shape = RoundedCornerShape(DesignTokens.componentParticipantChipRadius)
    val avatarSize = with(LocalDensity.current) {
        maxOf(
            DesignTokens.componentMobilePeopleChipAvatarSize,
            (
                DesignTokens.typographySizeMobilePeopleInitial *
                    DesignTokens.typographyLineHeightBody
                ).toDp(),
        )
    }
    Row(
        Modifier.testTag("participant-name-chip").heightIn(
            min = DesignTokens.componentParticipantChipHeight,
        ).clip(shape).background(color)
            .border(DesignTokens.spaceS2, DesignTokens.colorSurface, shape).padding(
                start = DesignTokens.componentMobilePeopleChipInsetStart,
                end = DesignTokens.componentMobilePeopleChipInsetEnd,
                top = DesignTokens.componentMobilePeopleChipInsetBlock,
                bottom = DesignTokens.componentMobilePeopleChipInsetBlock,
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
            textSize = DesignTokens.typographySizeMobilePeopleInitial,
            textColor = DesignTokens.colorParticipantChipText,
            textWeight = FontWeight(DesignTokens.typographyWeightParticipantChipAvatar.toInt()),
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
