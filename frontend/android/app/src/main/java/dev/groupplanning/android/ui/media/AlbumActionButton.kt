package dev.groupplanning.android.ui.media

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun AlbumActionButton(
    title: String,
    label: String,
    icon: @Composable (Modifier, Color) -> Unit,
    click: () -> Unit,
    modifier: Modifier = Modifier,
    primary: Boolean = false,
    busy: Boolean = false,
    enabled: Boolean = true,
) {
    val foreground = when {
        !enabled -> Palette.muted
        primary -> Palette.actionText
        else -> Palette.text
    }
    Surface(
        click,
        modifier.defaultMinSize(minHeight = DesignTokens.targetAndroid).semantics {
            contentDescription = label
        },
        enabled = enabled,
        shape = RoundedCornerShape(DesignTokens.componentButtonRadius),
        color = if (primary) Palette.action else Color.Transparent,
        contentColor = foreground,
        border = BorderStroke(
            DesignTokens.componentButtonBorderWidth,
            if (primary) Color.Transparent else DesignTokens.colorSubtleBorder,
        ),
    ) {
        Row(
            Modifier.padding(
                horizontal = DesignTokens.spaceS12 + DesignTokens.componentButtonBorderWidth,
                vertical = DesignTokens.componentButtonPaddingBlock +
                    DesignTokens.componentButtonBorderWidth,
            ),
            horizontalArrangement = Arrangement.spacedBy(
                DesignTokens.componentButtonIconGap,
                Alignment.CenterHorizontally,
            ),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (busy) {
                CircularProgressIndicator(
                    Modifier.size(DesignTokens.componentButtonIconSize).clearAndSetSemantics {},
                    color = foreground,
                    strokeWidth = DesignTokens.spaceS2,
                )
            } else {
                icon(Modifier.size(DesignTokens.componentButtonIconSize), foreground)
            }
            Text(
                title,
                Modifier.clearAndSetSemantics {},
                fontSize = DesignTokens.typographySizeSmall,
                lineHeight =
                DesignTokens.typographySizeSmall * DesignTokens.typographyLineHeightBody,
                fontWeight = FontWeight.SemiBold,
                textAlign = TextAlign.Center,
                color = foreground,
            )
        }
    }
}
