package dev.groupplanning.android.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.scale

@Composable
internal fun AvatarSilhouette(color: Color, modifier: Modifier = Modifier) {
    Canvas(modifier) {
        scale(size.width / 24f, size.height / 24f, Offset.Zero) {
            drawCircle(color, radius = 4f, center = Offset(12f, 8f))
            val body = Path().apply {
                moveTo(4f, 22f)
                lineTo(4f, 20f)
                arcTo(Rect(4f, 12f, 20f, 28f), 180f, 180f, false)
                lineTo(20f, 22f)
                close()
            }
            drawPath(body, color)
        }
    }
}
