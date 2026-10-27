package dev.groupplanning.android.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun CompactButton(
    title: String,
    modifier: Modifier = Modifier,
    primary: Boolean = false,
    enabled: Boolean = true,
    busy: Boolean = false,
    icon: Int? = null,
    click: () -> Unit,
) {
    val compact = LocalMobileSheet.current
    Surface(
        click,
        modifier.defaultMinSize(minHeight = DesignTokens.targetAndroid),
        enabled = enabled && !busy,
        shape = RoundedCornerShape(
            if (compact) {
                DesignTokens.componentMobileSheetButtonRadius
            } else {
                DesignTokens.componentButtonRadius
            },
        ),
        color = if (primary) Palette.action else Color.Transparent,
        contentColor = if (primary) Palette.actionText else Palette.text,
        border = if (primary) {
            null
        } else {
            BorderStroke(
                DesignTokens.spaceS1,
                DesignTokens.colorSubtleBorder,
            )
        },
    ) {
        Box(
            Modifier.padding(
                horizontal = if (compact) {
                    DesignTokens.componentMobileSheetButtonInsetInline
                } else {
                    DesignTokens.componentButtonPaddingInline
                },
                vertical = if (compact) {
                    DesignTokens.componentMobileSheetButtonInsetBlock
                } else {
                    DesignTokens.componentButtonPaddingBlock
                },
            ),
            contentAlignment = Alignment.Center,
        ) {
            if (busy) {
                CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
            } else {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(9.dp),
                ) {
                    icon?.let { AppIcon(it, Modifier.size(22.dp)) }
                    Text(
                        title,
                        fontSize = DesignTokens.typographySizeButton,
                        fontWeight = FontWeight.SemiBold,
                    )
                }
            }
        }
    }
}
