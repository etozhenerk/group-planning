package dev.groupplanning.android.ui.invitation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.InvitationPreview
import dev.groupplanning.android.state.covers.CoverSource
import dev.groupplanning.android.ui.components.UserAvatar
import dev.groupplanning.android.ui.components.meetingTime
import dev.groupplanning.android.ui.covers.CoverImage
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun InvitationFacts(
    value: InvitationPreview,
    showTitle: Boolean = true,
    closed: Boolean = false,
) {
    Column {
        value.coverUrl?.let {
            CoverImage(
                CoverSource.Remote(it, value.meetingId),
                fixedHeight = DesignTokens.componentMobileInvitationCoverHeight,
                cornerRadius = DesignTokens.radiusCard,
            )
            Spacer(Modifier.height(DesignTokens.spaceS24))
        }
        if (showTitle) {
            Text(
                stringResource(R.string.invitation_eyebrow),
                fontSize = DesignTokens.typographySizeLabel,
                color = DesignTokens.colorMuted,
            )
            Spacer(Modifier.height(DesignTokens.spaceS8))
            Text(
                value.title,
                Modifier.semantics { heading() },
                fontSize = DesignTokens.componentMobileInvitationTitleSize.value.sp,
                lineHeight =
                DesignTokens.componentMobileInvitationTitleSize.value.sp *
                    DesignTokens.componentActionHeadingLineHeight,
                fontWeight = FontWeight(DesignTokens.componentMobileInvitationTitleWeight.toInt()),
                letterSpacing = -DesignTokens.componentActionHeadingTrackingMobile.value.sp,
            )
            Spacer(Modifier.height(DesignTokens.componentMobileInvitationTitleGap))
        }
        value.organizer?.let {
            Row(
                horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS10),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                UserAvatar(
                    it.displayName,
                    it.avatarUrl,
                    avatarColor = DesignTokens.colorRosterLilac,
                )
                Text(
                    stringResource(R.string.invitation_inviter, it.displayName),
                    fontSize = DesignTokens.typographySizeSmall,
                )
            }
            Spacer(Modifier.height(DesignTokens.spaceS24))
        }
        if (closed) {
            InvitationClosed(value.myRsvp)
            Spacer(Modifier.height(DesignTokens.componentMobileInvitationClosedGap))
        }
        HorizontalDivider(color = DesignTokens.colorLine)
        Column(
            Modifier.padding(vertical = DesignTokens.componentMobileInvitationFactsInsetBlock),
            verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS24),
        ) {
            InvitationFact(
                R.drawable.ic_calendar,
                meetingTime(
                    value.startsAt,
                    value.timezone,
                    value.startsOn,
                    includeMissingTime = false,
                ),
                if (value.startsAt ==
                    null
                ) {
                    stringResource(R.string.invitation_time_missing)
                } else {
                    invitationTimezone(value.timezone)
                },
            )
            InvitationFact(
                R.drawable.ic_place,
                value.place ?: stringResource(R.string.place_unknown),
            )
        }
        HorizontalDivider(color = DesignTokens.colorLine)
        value.description?.takeIf { it.isNotBlank() }?.let {
            Text(
                it,
                Modifier.padding(top = DesignTokens.spaceS20),
                fontSize = DesignTokens.componentMobileInvitationDescriptionFontSize.value.sp,
                lineHeight =
                DesignTokens.componentMobileInvitationDescriptionFontSize.value.sp *
                    DesignTokens.typographyLineHeightMeetingDescription,
                color = DesignTokens.colorMuted,
            )
        }
    }
}
