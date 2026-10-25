package dev.groupplanning.android.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntRect
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Popup
import androidx.compose.ui.window.PopupPositionProvider
import androidx.compose.ui.window.PopupProperties

@Composable
internal fun FloatingPanel(
    close: () -> Unit,
    width: Dp = 336.dp,
    content: @Composable ColumnScope.() -> Unit,
) {
    val density = LocalDensity.current
    val position = remember(density) {
        object : PopupPositionProvider {
            override fun calculatePosition(
                anchorBounds: IntRect,
                windowSize: IntSize,
                layoutDirection: LayoutDirection,
                popupContentSize: IntSize,
            ): IntOffset = with(density) {
                IntOffset(
                    12.dp.roundToPx(),
                    (windowSize.height - 88.dp.roundToPx() - popupContentSize.height)
                        .coerceAtLeast(12.dp.roundToPx()),
                )
            }
        }
    }
    Popup(
        position,
        onDismissRequest = close,
        properties = PopupProperties(focusable = true),
    ) {
        Surface(
            Modifier.widthIn(max = width).heightIn(max = 440.dp),
            shape = RoundedCornerShape(19.dp),
            color = Color(0xff36373f),
            border = BorderStroke(1.dp, Color(0x14ffffff)),
            shadowElevation = 20.dp,
        ) {
            Column(Modifier.padding(8.dp), content = content)
        }
    }
}
