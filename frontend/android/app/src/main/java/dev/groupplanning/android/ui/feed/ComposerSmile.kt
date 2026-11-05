package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.PathParser
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun ComposerSmile(modifier: Modifier = Modifier) {
    // Exact 24 × 24 geometry from the published composer-smile.svg.
    val image = remember {
        ImageVector.Builder(
            "ComposerSmile",
            DesignTokens.componentChatComposerEmojiIcon,
            DesignTokens.componentChatComposerEmojiIcon,
            24f,
            24f,
        ).addPath(
            pathData = PathParser().parsePathString(
                "M12,3.5 A8.5,8.5 0,1 0,12 20.5 A8.5,8.5 0,1 0,12 3.5 M9,14 Q12,16.4 15,14",
            ).toNodes(),
            stroke = SolidColor(DesignTokens.colorText),
            strokeLineWidth = DesignTokens.componentMobileMessageSmileStroke,
            strokeLineCap = StrokeCap.Round,
            strokeLineJoin = StrokeJoin.Round,
        ).addPath(
            pathData = PathParser().parsePathString(
                "M9,9.3 A0.7,0.7 0,1 0,9 10.7 A0.7,0.7 0,1 0,9 9.3 " +
                    "M15,9.3 A0.7,0.7 0,1 0,15 10.7 A0.7,0.7 0,1 0,15 9.3",
            ).toNodes(),
            fill = SolidColor(DesignTokens.colorText),
        ).build()
    }
    Icon(
        image,
        contentDescription = null,
        modifier.size(DesignTokens.componentChatComposerEmojiIcon),
        tint = DesignTokens.colorMuted,
    )
}
