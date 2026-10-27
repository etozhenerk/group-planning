package dev.groupplanning.android.ui.motion

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.tween
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import dev.groupplanning.android.ui.theme.DesignTokens

internal data class SurfaceTransition(val visible: Boolean, val progress: Float)

@Composable
internal fun rememberSurfaceTransition(
    open: Boolean,
    enterDuration: Int,
    exitDuration: Int,
): SurfaceTransition {
    val motion = LocalMotionEnabled.current
    val progress = remember { Animatable(if (open) 1f else 0f) }
    var retained by remember { mutableStateOf(open) }
    val easing = remember {
        DesignTokens.motionEasingStandard.let { CubicBezierEasing(it[0], it[1], it[2], it[3]) }
    }
    LaunchedEffect(open, motion, enterDuration, exitDuration) {
        if (open) retained = true
        val target = if (open) 1f else 0f
        if (motion) {
            // Cancellation preserves progress; an old exit cannot remove a reopened surface.
            progress.animateTo(
                target,
                tween(if (open) enterDuration else exitDuration, easing = easing),
            )
        } else {
            progress.snapTo(target)
        }
        if (!open) retained = false
    }
    return SurfaceTransition(
        visible = open || (motion && retained),
        progress = if (motion) {
            progress.value
        } else if (open) {
            1f
        } else {
            0f
        },
    )
}
