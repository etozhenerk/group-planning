package dev.groupplanning.android.ui.service

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun SupportSuccess(reference: String, close: () -> Unit) {
    Surface(
        Modifier.fillMaxWidth().padding(horizontal = DesignTokens.spaceS20)
            .padding(top = DesignTokens.spaceS20, bottom = DesignTokens.spaceS40),
        color = Palette.surface,
        shape = RoundedCornerShape(DesignTokens.spaceS20),
    ) {
        Column(
            Modifier.padding(
                horizontal = DesignTokens.spaceS24,
                vertical = DesignTokens.spaceS24 + DesignTokens.spaceS4,
            ),
        ) {
            Box(
                Modifier.size(DesignTokens.componentMobileSupportReceiptIconTile)
                    .background(Palette.background, RoundedCornerShape(DesignTokens.spaceS16)),
                contentAlignment = Alignment.Center,
            ) {
                ServiceIcon(ChatSymbol.Check, DesignTokens.spaceS24, Palette.accent)
            }
            Text(
                stringResource(R.string.support_sent),
                Modifier.padding(
                    top = DesignTokens.spaceS24 + DesignTokens.spaceS4,
                    bottom = DesignTokens.spaceS24 + DesignTokens.spaceS2,
                ),
                fontSize = DesignTokens.componentMobileSupportReceiptTitleSize.value.sp,
                lineHeight = DesignTokens.componentMobileSupportReceiptTitleLineHeight.value.sp,
                fontWeight = FontWeight.SemiBold,
            )
            Text(
                stringResource(R.string.support_reference_label),
                fontSize = DesignTokens.typographySizeCaption,
                color = Palette.muted,
            )
            Text(
                reference,
                Modifier.padding(top = DesignTokens.spaceS8),
                fontSize = DesignTokens.componentMobileSupportReceiptNumberSize.value.sp,
                lineHeight = DesignTokens.componentMobileSupportReceiptNumberLineHeight.value.sp,
                fontWeight = FontWeight.Medium,
            )
            ServiceActionButton(
                stringResource(R.string.support_to_help),
                Modifier.fillMaxWidth().padding(top = DesignTokens.spaceS32)
                    .testTag("support-success-back"),
                click = close,
            )
        }
    }
}
