package dev.groupplanning.android.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun FormSubmissionNotice(title: String, explanation: String) {
    Row(horizontalArrangement = Arrangement.spacedBy(DesignTokens.componentInvitationNoticeGap)) {
        ChatIcon(
            ChatSymbol.Alert,
            Modifier.background(
                DesignTokens.colorInvitationNoticeBackground,
                RoundedCornerShape(DesignTokens.componentInvitationNoticeIconRadius),
            )
                .padding(
                    DesignTokens.spaceS8,
                ).size(DesignTokens.componentInvitationNoticeGlyphSize),
            tint = DesignTokens.colorError,
        )
        Column(
            Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(
                DesignTokens.componentInvitationNoticeCopyGap,
            ),
        ) {
            Text(
                title,
                fontSize = DesignTokens.typographySizeSmall,
                fontWeight = FontWeight.SemiBold,
            )
            Text(
                explanation,
                fontSize = DesignTokens.typographySizeCaption,
                lineHeight =
                DesignTokens.typographySizeCaption * DesignTokens.typographyLineHeightBody,
                color = DesignTokens.colorMuted,
            )
        }
    }
}
