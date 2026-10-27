package dev.groupplanning.android.ui.invitation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.InvitationPreview
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.components.meetingTime
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun MeetingInformationFacts(value: InvitationPreview) {
    Column(
        Modifier.testTag("meeting-information-facts"),
        verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS16),
    ) {
        listOf(
            ChatSymbol.Calendar to meetingTime(value.startsAt, value.timezone, value.startsOn),
            ChatSymbol.Pin to (value.place ?: stringResource(R.string.place_unknown)),
        ).forEach { (icon, text) ->
            Row(
                horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS12),
                verticalAlignment = Alignment.Top,
            ) {
                ChatIcon(icon, Modifier.size(DesignTokens.componentMobileFieldIconSize))
                Text(
                    text,
                    fontSize = DesignTokens.typographySizeButton,
                    lineHeight =
                    DesignTokens.typographySizeButton * DesignTokens.typographyLineHeightBody,
                )
            }
        }
        value.description?.takeIf { it.isNotBlank() }?.let {
            Text(
                it,
                fontSize = DesignTokens.typographySizeSmall,
                lineHeight =
                DesignTokens.typographySizeSmall *
                    DesignTokens.typographyLineHeightMeetingDescription,
                color = DesignTokens.colorMuted,
            )
        }
    }
}
