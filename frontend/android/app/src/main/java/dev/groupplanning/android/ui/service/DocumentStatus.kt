package dev.groupplanning.android.ui.service

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun DocumentStatus() {
    Surface(
        color = Palette.surface,
        shape = RoundedCornerShape(DesignTokens.componentMobileServiceFieldRadius),
    ) {
        Column(
            Modifier.fillMaxWidth().padding(DesignTokens.spaceS16),
            verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8),
        ) {
            Row(horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8)) {
                ServiceIcon(
                    ChatSymbol.FilePenLine,
                    DesignTokens.spaceS16 + DesignTokens.spaceS2,
                    Palette.accent,
                    strokeWidth = DesignTokens.componentMobileUnreadIconStrokeWidth,
                )
                Text(
                    stringResource(R.string.legal_draft),
                    fontSize = DesignTokens.typographySizeCaption,
                    lineHeight = (DesignTokens.spaceS16 + DesignTokens.spaceS2).value.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Palette.accent,
                )
            }
            Text(
                stringResource(R.string.document_draft_note),
                fontSize = DesignTokens.typographySizeCaption,
                lineHeight = DesignTokens.componentMobileAboutStatusLineHeight.value.sp,
                color = Palette.muted,
            )
        }
    }
}
