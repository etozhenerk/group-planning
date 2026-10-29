package dev.groupplanning.android.ui.media

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
internal fun AlbumDownloadIcon(modifier: Modifier, tint: Color) {
    // Exact geometry from the published album prototype, in its 24 × 24 viewport.
    val vector = remember {
        ImageVector.Builder(
            "AlbumDownload",
            DesignTokens.componentButtonIconSize,
            DesignTokens.componentButtonIconSize,
            24f,
            24f,
        ).addPath(
            pathData = PathParser().parsePathString(
                "M12,15 L12,3 M21,15 L21,19 A2,2 0,0 1,19 21 L5,21 " +
                    "A2,2 0,0 1,3 19 L3,15 M7,10 L12,15 L17,10",
            ).toNodes(),
            stroke = SolidColor(DesignTokens.colorText),
            strokeLineWidth = DesignTokens.componentIconStrokeWidth,
            strokeLineCap = StrokeCap.Round,
            strokeLineJoin = StrokeJoin.Round,
        ).build()
    }
    Icon(vector, null, modifier, tint)
}
