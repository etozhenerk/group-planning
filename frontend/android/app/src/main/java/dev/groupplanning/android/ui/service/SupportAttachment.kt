package dev.groupplanning.android.ui.service

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun SupportAttachment(enabled: Boolean, click: () -> Unit) {
    val border = DesignTokens.colorBorderStrong
    Surface(
        click,
        Modifier.fillMaxWidth().drawWithContent {
            drawContent()
            drawRoundRect(
                border,
                cornerRadius = CornerRadius(
                    DesignTokens.componentMobileServiceFieldRadius.toPx(),
                ),
                style = Stroke(
                    width = DesignTokens.spaceS1.toPx(),
                    pathEffect = PathEffect.dashPathEffect(
                        floatArrayOf(
                            DesignTokens.spaceS4.toPx(),
                            DesignTokens.spaceS4.toPx(),
                        ),
                    ),
                ),
            )
        },
        enabled = enabled,
        color = Palette.background,
        shape = RoundedCornerShape(DesignTokens.componentMobileServiceFieldRadius),
    ) {
        Row(
            Modifier.heightIn(min = DesignTokens.componentMobileSupportAttachmentHeight)
                .padding(horizontal = (DesignTokens.spaceS12 + DesignTokens.spaceS2)),
            horizontalArrangement = Arrangement.spacedBy(
                DesignTokens.spaceS12,
                Alignment.CenterHorizontally,
            ),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            ServiceIcon(
                ChatSymbol.Paperclip,
                DesignTokens.spaceS20 + DesignTokens.spaceS1,
                Palette.accent,
            )
            Column(verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS4)) {
                Text(
                    stringResource(R.string.support_attach),
                    fontSize = DesignTokens.typographySizeSmall,
                )
                Text(
                    stringResource(R.string.support_attachment_hint),
                    fontSize = DesignTokens.typographySizeLabel,
                    color = Palette.muted,
                )
            }
        }
    }
}
