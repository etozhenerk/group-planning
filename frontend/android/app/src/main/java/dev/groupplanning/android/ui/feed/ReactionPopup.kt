package dev.groupplanning.android.ui.feed

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.animation.core.MutableTransitionState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntRect
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.window.Popup
import androidx.compose.ui.window.PopupPositionProvider
import androidx.compose.ui.window.PopupProperties
import dev.groupplanning.android.ui.motion.LocalMotionEnabled
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun ReactionPopup(
    bounds: Rect,
    anchor: Rect,
    open: Boolean,
    close: () -> Unit,
    closed: () -> Unit,
    content: @Composable () -> Unit,
) {
    val visibility = remember { MutableTransitionState(false) }
    visibility.targetState = open
    var presented by remember { mutableStateOf(false) }
    LaunchedEffect(open, visibility.currentState, visibility.isIdle) {
        if (open) presented = true
        if (presented && visibility.isIdle && !visibility.currentState && !open) {
            presented = false
            closed()
        }
    }
    val motion = LocalMotionEnabled.current
    val density = LocalDensity.current
    val offset = with(density) { DesignTokens.componentReactionPickerEnterOffset.roundToPx() }
    val position = remember(bounds) {
        object : PopupPositionProvider {
            override fun calculatePosition(
                anchorBounds: IntRect,
                windowSize: IntSize,
                layoutDirection: LayoutDirection,
                popupContentSize: IntSize,
            ): IntOffset = IntOffset(bounds.left.toInt(), bounds.top.toInt())
        }
    }
    val positioned = !bounds.isEmpty && !anchor.isEmpty
    if (positioned && (visibility.currentState || visibility.targetState || !visibility.isIdle)) {
        Popup(position, onDismissRequest = close, properties = PopupProperties(focusable = true)) {
            ReactionPopupLayout(bounds, anchor, close) {
                val enterDuration = DesignTokens.motionDurationReactionEnter
                val exitDuration = DesignTokens.motionDurationReactionExit
                AnimatedVisibility(
                    visibleState = visibility,
                    enter = if (motion) {
                        fadeIn(tween(enterDuration, easing = reactionEasing)) +
                            scaleIn(
                                tween(enterDuration, easing = reactionEasing),
                                initialScale = DesignTokens.componentReactionPickerEnterScale,
                            ) +
                            slideInVertically(tween(enterDuration, easing = reactionEasing)) {
                                offset
                            }
                    } else {
                        EnterTransition.None
                    },
                    exit = if (motion) {
                        fadeOut(tween(exitDuration, easing = reactionEasing)) +
                            scaleOut(
                                tween(exitDuration, easing = reactionEasing),
                                targetScale = DesignTokens.componentReactionPickerEnterScale,
                            ) +
                            slideOutVertically(tween(exitDuration, easing = reactionEasing)) {
                                offset
                            }
                    } else {
                        ExitTransition.None
                    },
                ) { content() }
            }
        }
    }
}
