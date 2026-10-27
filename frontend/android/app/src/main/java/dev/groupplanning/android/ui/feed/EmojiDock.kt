package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.focusGroup
import androidx.compose.foundation.layout.Box
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.layout
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.semantics.clearAndSetSemantics
import dev.groupplanning.android.ui.motion.rememberSurfaceTransition
import dev.groupplanning.android.ui.theme.DesignTokens
import kotlin.math.roundToInt

@Composable
internal fun EmojiDock(
    open: Boolean,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    val transition = rememberSurfaceTransition(
        open,
        DesignTokens.motionDurationEmojiPanelEnter,
        DesignTokens.motionDurationEmojiPanelExit,
    )
    val focus = LocalFocusManager.current
    var hasFocus by remember { mutableStateOf(false) }
    LaunchedEffect(open) {
        if (!open && hasFocus) focus.clearFocus()
    }
    if (transition.visible) {
        val fraction = transition.progress
        Box(
            modifier.clipToBounds().graphicsLayer { alpha = fraction }.layout {
                    measurable,
                    constraints,
                ->
                val panel = measurable.measure(constraints.copy(minHeight = 0))
                layout(panel.width, (panel.height * fraction).roundToInt()) { panel.place(0, 0) }
            }.onFocusChanged { hasFocus = it.hasFocus }.focusGroup()
                .then(if (open) Modifier else Modifier.clearAndSetSemantics {})
                .onPreviewKeyEvent { !open }
                .pointerInput(open) {
                    if (!open) {
                        awaitPointerEventScope {
                            while (true) {
                                awaitPointerEvent(PointerEventPass.Initial).changes.forEach {
                                    it.consume()
                                }
                            }
                        }
                    }
                },
        ) { content() }
    }
}
