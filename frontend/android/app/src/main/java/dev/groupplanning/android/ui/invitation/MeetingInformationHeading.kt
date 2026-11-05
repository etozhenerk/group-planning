package dev.groupplanning.android.ui.invitation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.size
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.InvitationPreview
import dev.groupplanning.android.data.api.models.UserProfile
import dev.groupplanning.android.state.covers.CoverSource
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.components.UserAvatar
import dev.groupplanning.android.ui.covers.CoverImage
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun MeetingInformationHeading(
    preview: InvitationPreview,
    organizer: UserProfile?,
    own: Boolean,
    settings: () -> Unit,
) {
    val density = LocalDensity.current
    preview.coverUrl?.let {
        CoverImage(
            CoverSource.Remote(it, preview.meetingId),
            fixedHeight = DesignTokens.componentMobileInfoCoverHeight,
            cornerRadius = DesignTokens.spaceS20,
        )
    }
    Column(verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS12)) {
        Text(
            preview.title,
            Modifier.semantics { heading() },
            fontSize = with(density) { DesignTokens.componentMobileInfoTitleSize.toSp() },
            lineHeight = with(density) { DesignTokens.componentMobileInfoTitleLineHeight.toSp() },
            letterSpacing = DesignTokens.componentMobileInfoTitleTracking.sp,
            fontWeight = FontWeight(DesignTokens.typographyWeightMobileSheetTitle.toInt()),
        )
        Row(
            Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8),
        ) {
            UserAvatar(
                organizer?.displayName ?: stringResource(R.string.info_organizer_unknown),
                organizer?.avatarUrl,
                size = DesignTokens.componentMobileInfoOrganizerAvatarSize,
            )
            Text(
                if (own) {
                    stringResource(R.string.info_organizer_own)
                } else {
                    organizer?.let {
                        stringResource(R.string.info_organizer_name, it.displayName)
                    } ?: stringResource(R.string.info_organizer_unknown)
                },
                Modifier.weight(1f),
                fontSize = DesignTokens.typographySizeCaption,
                color = DesignTokens.colorMuted,
            )
            if (own) {
                val label = stringResource(R.string.meeting_settings)
                IconButton(
                    settings,
                    Modifier.testTag("open-settings").semantics {
                        contentDescription =
                            label
                    },
                ) {
                    ChatIcon(
                        ChatSymbol.Settings,
                        Modifier.size(DesignTokens.componentMobileChatIconSize),
                    )
                }
            }
        }
    }
}
