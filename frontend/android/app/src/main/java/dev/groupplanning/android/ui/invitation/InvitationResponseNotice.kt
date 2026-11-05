package dev.groupplanning.android.ui.invitation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import dev.groupplanning.android.R
import dev.groupplanning.android.state.InvitationIssue
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun InvitationResponseNotice(issue: InvitationIssue) {
    Row(
        Modifier.padding(
            start = DesignTokens.componentInvitationNoticeOuterInset,
            end = DesignTokens.componentInvitationNoticeOuterInset,
            top = DesignTokens.componentInvitationNoticeOuterInset,
            bottom = DesignTokens.componentInvitationNoticeBottomSpace,
        ).semantics { liveRegion = LiveRegionMode.Assertive },
        horizontalArrangement = Arrangement.spacedBy(DesignTokens.componentInvitationNoticeGap),
        verticalAlignment = Alignment.Top,
    ) {
        Box(
            Modifier.size(DesignTokens.componentInvitationNoticeIconSize).background(
                DesignTokens.colorInvitationNoticeBackground,
                RoundedCornerShape(DesignTokens.componentInvitationNoticeIconRadius),
            ),
            contentAlignment = Alignment.Center,
        ) {
            ChatIcon(
                ChatSymbol.Alert,
                Modifier.size(DesignTokens.componentInvitationNoticeGlyphSize),
                tint = DesignTokens.colorError,
            )
        }
        Column(
            Modifier.padding(top = DesignTokens.componentInvitationNoticeCopyTop),
            verticalArrangement = Arrangement.spacedBy(
                DesignTokens.componentInvitationNoticeCopyGap,
            ),
        ) {
            Text(
                stringResource(R.string.invitation_response_error),
                fontSize = DesignTokens.typographySizeSmall,
                lineHeight =
                DesignTokens.typographySizeSmall *
                    DesignTokens.componentInvitationNoticeTitleLineHeight,
                fontWeight = FontWeight(DesignTokens.typographyWeightSemibold.toInt()),
            )
            Text(
                stringResource(
                    when (issue) {
                        InvitationIssue.Conflict -> R.string.rsvp_conflict
                        InvitationIssue.Rejected -> R.string.rsvp_rejected
                        else -> R.string.rsvp_unconfirmed
                    },
                ),
                fontSize = DesignTokens.typographySizeCaption,
                lineHeight =
                DesignTokens.typographySizeCaption * DesignTokens.typographyLineHeightBody,
                color = DesignTokens.colorMuted,
            )
        }
    }
}
