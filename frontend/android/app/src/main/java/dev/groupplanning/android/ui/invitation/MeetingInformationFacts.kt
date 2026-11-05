package dev.groupplanning.android.ui.invitation

import android.icu.text.TimeZoneNames
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
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
import java.util.Locale

@Composable
internal fun MeetingInformationFacts(value: InvitationPreview) {
    Column(
        Modifier.fillMaxWidth().testTag("meeting-information-facts")
            .background(
                DesignTokens.colorBackground,
                RoundedCornerShape(DesignTokens.componentMobileChatBubbleRadius),
            )
            .border(
                DesignTokens.spaceS1,
                DesignTokens.colorLine,
                RoundedCornerShape(DesignTokens.componentMobileChatBubbleRadius),
            )
            .padding(horizontal = DesignTokens.spaceS16, vertical = DesignTokens.spaceS20),
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
                Column {
                    Text(
                        text,
                        fontSize = DesignTokens.typographySizeButton,
                        lineHeight =
                        DesignTokens.typographySizeButton *
                            DesignTokens.typographyLineHeightBody,
                    )
                    if (icon == ChatSymbol.Calendar) {
                        Text(
                            if (value.startsAt ==
                                null
                            ) {
                                stringResource(R.string.info_time_unknown)
                            } else {
                                TimeZoneNames.getInstance(Locale.forLanguageTag("ru"))
                                    .getExemplarLocationName(value.timezone) ?: value.timezone
                            },
                            fontSize = DesignTokens.typographySizeCaption,
                            color = DesignTokens.colorMuted,
                        )
                    }
                }
            }
        }
    }
}
