package dev.groupplanning.android.ui.onboarding

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.motion.LocalMotionEnabled
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun OnboardingQuietButton(
    title: String,
    visible: Boolean,
    enabled: Boolean,
    back: Boolean = false,
    onClick: () -> Unit,
) {
    val motion = LocalMotionEnabled.current
    val reveal by animateFloatAsState(
        if (visible) 1f else 0f,
        tween(if (motion) 250 else 0),
        label = "navigation-reveal",
    )
    TextButton(
        onClick = onClick,
        enabled = visible && enabled,
        modifier = Modifier.defaultMinSize(minHeight = 48.dp).graphicsLayer {
            alpha = reveal
            translationX = if (motion) (1 - reveal) * -4.dp.toPx() else 0f
        }.then(if (visible) Modifier else Modifier.clearAndSetSemantics {}),
    ) {
        Row {
            if (back) AppIcon(R.drawable.ic_back)
            Text(title, color = Palette.muted)
        }
    }
}
