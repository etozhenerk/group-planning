package dev.groupplanning.android.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntRect
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.window.Popup
import androidx.compose.ui.window.PopupPositionProvider
import androidx.compose.ui.window.PopupProperties
import dev.groupplanning.android.ui.feed.LocalChatPresentation
import dev.groupplanning.android.ui.motion.rememberSurfaceTransition
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun FloatingPanel(
    open: Boolean,
    close: () -> Unit,
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit,
) {
    val density = LocalDensity.current
    val bounds = LocalChatPresentation.current.conversationBounds
    val slideOffset = with(density) { DesignTokens.spaceS8.roundToPx() }
    val transition = rememberSurfaceTransition(
        open,
        DesignTokens.motionDurationMobileSheet,
        DesignTokens.motionDurationFast,
    )
    val position = remember(density, bounds) {
        object : PopupPositionProvider {
            override fun calculatePosition(
                anchorBounds: IntRect,
                windowSize: IntSize,
                layoutDirection: LayoutDirection,
                popupContentSize: IntSize,
            ): IntOffset = with(density) {
                IntOffset(
                    DesignTokens.componentMobileChatHeaderInset.roundToPx(),
                    (
                        anchorBounds.top - DesignTokens.componentChatAddMenuOffset.roundToPx() -
                            (popupContentSize.height - slideOffset)
                        )
                        .coerceAtLeast(bounds.top.toInt()),
                )
            }
        }
    }
    if (transition.visible && !bounds.isEmpty) {
        Popup(
            position,
            onDismissRequest = { if (open) close() },
            properties = PopupProperties(focusable = open),
        ) {
            // Reserve the slide range once, keeping the window rect and final anchor unchanged.
            Box(modifier.padding(bottom = DesignTokens.spaceS8)) {
                Surface(
                    Modifier.widthIn(max = DesignTokens.componentChatAddMenuWidth)
                        .heightIn(max = with(density) { bounds.height.toDp() })
                        .graphicsLayer {
                            alpha = transition.progress
                            translationY = slideOffset * (1f - transition.progress)
                        }.then(if (open) Modifier else Modifier.clearAndSetSemantics {})
                        .pointerInput(open) {
                            if (!open) {
                                awaitPointerEventScope {
                                    while (true) {
                                        val event = awaitPointerEvent(PointerEventPass.Initial)
                                        event.changes.forEach {
                                            it.consume()
                                        }
                                    }
                                }
                            }
                        },
                    shape = RoundedCornerShape(DesignTokens.componentChatAddMenuRadius),
                    color = DesignTokens.colorSurface,
                    border = BorderStroke(DesignTokens.spaceS1, DesignTokens.colorBorderStrong),
                ) {
                    Column(
                        Modifier.verticalScroll(
                            rememberScrollState(),
                        ).padding(DesignTokens.componentChatAddMenuInset),
                        content = content,
                    )
                }
            }
        }
    }
}
