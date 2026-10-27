package dev.groupplanning.android.ui.feed

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.border
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.graphicsLayer
import dev.groupplanning.android.ui.motion.LocalMotionEnabled
import dev.groupplanning.android.ui.theme.DesignTokens

internal val reactionEasing = DesignTokens.motionEasingStandard.let {
    CubicBezierEasing(it[0], it[1], it[2], it[3])
}

@Composable
internal fun reactionContainerColor(selected: Boolean): Color {
    val motion = LocalMotionEnabled.current
    val color by animateColorAsState(
        if (selected) DesignTokens.colorSelectedSegment else DesignTokens.colorSurface,
        tween(
            if (motion) DesignTokens.motionDurationReactionFeedback else 0,
            easing = reactionEasing,
        ),
        label = "reaction-background",
    )
    return color
}

@Composable
internal fun Modifier.reactionFeedback(
    selected: Boolean,
    interactions: MutableInteractionSource,
    shape: Shape,
): Modifier {
    val motion = LocalMotionEnabled.current
    val pressed by interactions.collectIsPressedAsState()
    val duration = if (motion) DesignTokens.motionDurationReactionFeedback else 0
    val scale by animateFloatAsState(
        if (motion && pressed) DesignTokens.componentReactionPickerPressedScale else 1f,
        tween(duration, easing = reactionEasing),
        label = "reaction-press",
    )
    val outline by animateColorAsState(
        if (selected) DesignTokens.colorAccent else Color.Transparent,
        tween(duration, easing = reactionEasing),
        label = "reaction-selection",
    )
    return graphicsLayer {
        scaleX = scale
        scaleY = scale
    }.border(DesignTokens.componentReactionPickerSelectedOutlineWidth, outline, shape)
}
