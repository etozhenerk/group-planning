package dev.groupplanning.android.ui.invitation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.heightIn
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.Participant
import dev.groupplanning.android.ui.components.UserAvatar
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun ParticipantRosterRow(participant: Participant, color: Color) {
    val bodyLineHeight = DesignTokens.typographySizeSmall * DesignTokens.typographyLineHeightBody
    val captionLineHeight =
        DesignTokens.typographySizeLabel * DesignTokens.typographyLineHeightBody
    val avatarSize = with(LocalDensity.current) {
        maxOf(
            DesignTokens.componentMobileRosterAvatarSize,
            (
                DesignTokens.typographySizeParticipantRosterAvatar *
                    DesignTokens.typographyLineHeightBody
                ).toDp(),
        )
    }
    Row(
        Modifier.heightIn(
            min = DesignTokens.componentMobileRosterRowHeight,
        ).testTag("participant-roster-row"),
        horizontalArrangement = Arrangement.spacedBy(DesignTokens.componentMobileRosterRowGap),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        UserAvatar(
            participant.user.displayName,
            participant.user.avatarUrl,
            size = avatarSize,
            avatarColor = color,
            textSize = DesignTokens.typographySizeParticipantRosterAvatar,
            textColor = DesignTokens.colorRosterText,
            textWeight = FontWeight(DesignTokens.typographyWeightParticipantRosterAvatar.toInt()),
        )
        Column(Modifier.weight(1f)) {
            Text(
                participant.user.displayName,
                fontSize = DesignTokens.typographySizeSmall,
                lineHeight = bodyLineHeight,
            )
            Text(
                stringResource(
                    if (participant.role == "organizer") {
                        R.string.organizer
                    } else {
                        participant.rsvp?.label() ?: R.string.rsvp_no_answer
                    },
                ),
                color = DesignTokens.colorMuted,
                fontSize = DesignTokens.typographySizeLabel,
                lineHeight = captionLineHeight,
            )
        }
    }
}
