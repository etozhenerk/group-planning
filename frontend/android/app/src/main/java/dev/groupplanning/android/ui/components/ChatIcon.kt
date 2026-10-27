package dev.groupplanning.android.ui.components

import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.PathParser
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun ChatIcon(
    symbol: ChatSymbol,
    modifier: Modifier = Modifier,
    tint: Color = DesignTokens.colorMuted,
) {
    val vector = remember(symbol) {
        ImageVector.Builder(
            symbol.name,
            DesignTokens.componentChatComposerEmojiIcon,
            DesignTokens.componentChatComposerEmojiIcon,
            24f,
            24f,
        ).addPath(
            pathData = PathParser().parsePathString(symbol.path).toNodes(),
            stroke = SolidColor(DesignTokens.colorText),
            strokeLineWidth = DesignTokens.componentIconStrokeWidth,
            strokeLineCap = StrokeCap.Round,
            strokeLineJoin = StrokeJoin.Round,
        ).apply {
            symbol.fillPath?.let { filled ->
                addPath(
                    pathData = PathParser().parsePathString(filled).toNodes(),
                    fill = SolidColor(DesignTokens.colorText),
                )
            }
        }.build()
    }
    Icon(vector, null, modifier.size(DesignTokens.componentMobileChatIconSize), tint = tint)
}
