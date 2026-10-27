package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.platform.LocalDensity
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun ReactionPopupLayout(
    bounds: Rect,
    anchor: Rect,
    close: () -> Unit,
    content: @Composable () -> Unit,
) {
    val density = LocalDensity.current
    val edge = with(density) { DesignTokens.componentReactionPickerEdgeInset.roundToPx() }
    val gap = with(density) { DesignTokens.componentReactionPickerAnchorGap.roundToPx() }
    val hitRegion = remember { ReactionPopupHitRegion() }
    val currentClose by rememberUpdatedState(close)
    // Keep the Android window fixed. Measure and place quick/full content in one layout pass,
    // so WindowManager cannot move the previous content buffer before its replacement is drawn.
    Layout(
        content = content,
        modifier = Modifier.size(
            with(density) { bounds.width.toDp() },
            with(density) { bounds.height.toDp() },
        ).pointerInput(Unit) {
            detectTapGestures { position ->
                if (!hitRegion.bounds.contains(position)) currentClose()
            }
        },
    ) { measurables, constraints ->
        val panel = measurables.single().measure(constraints.copy(minWidth = 0, minHeight = 0))
        val right = constraints.maxWidth - edge
        val bottom = constraints.maxHeight - edge
        val above = (anchor.top - bounds.top).toInt() - gap - panel.height
        val below = (anchor.bottom - bounds.top).toInt() + gap
        val preferredY = when {
            above >= edge -> above
            below + panel.height <= bottom -> below
            else -> edge
        }
        val x = (anchor.left - bounds.left).toInt().coerceIn(
            edge,
            (right - panel.width).coerceAtLeast(edge),
        )
        val y = preferredY.coerceAtMost((bottom - panel.height).coerceAtLeast(edge))
        layout(constraints.maxWidth, constraints.maxHeight) {
            hitRegion.bounds = Rect(
                x.toFloat(),
                y.toFloat(),
                (x + panel.width).toFloat(),
                (y + panel.height).toFloat(),
            )
            panel.place(x, y)
        }
    }
}

private class ReactionPopupHitRegion {
    var bounds = Rect.Zero
}
