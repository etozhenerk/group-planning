package dev.groupplanning.android.ui.service

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.rotate
import dev.groupplanning.android.ui.motion.LocalMotionEnabled
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun HelpDisclosureIcon(expanded: Boolean) {
    val easing = remember {
        DesignTokens.motionEasingStandard.let { CubicBezierEasing(it[0], it[1], it[2], it[3]) }
    }
    val progress by animateFloatAsState(
        if (expanded) 1f else 0f,
        tween(
            if (LocalMotionEnabled.current) DesignTokens.motionDurationCard else 0,
            easing = easing,
        ),
        label = "help-disclosure",
    )
    Canvas(Modifier.size(DesignTokens.componentHelpDisclosureSymbolSize)) {
        val extent = (
            DesignTokens.componentHelpDisclosureSymbolLineLength -
                DesignTokens.componentHelpDisclosureSymbolStroke
            ).toPx() / 2
        val stroke = DesignTokens.componentHelpDisclosureSymbolStroke.toPx()
        drawLine(
            DesignTokens.colorText,
            Offset(center.x - extent, center.y),
            Offset(center.x + extent, center.y),
            stroke,
            cap = StrokeCap.Round,
        )
        rotate(progress * 90f) {
            drawLine(
                DesignTokens.colorText.copy(alpha = 1f - progress),
                Offset(center.x, center.y - extent),
                Offset(center.x, center.y + extent),
                stroke,
                cap = StrokeCap.Round,
            )
        }
    }
}
