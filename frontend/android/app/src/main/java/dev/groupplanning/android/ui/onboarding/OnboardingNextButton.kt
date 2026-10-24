package dev.groupplanning.android.ui.onboarding

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.requiredWidth
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.motion.LocalMotionEnabled
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun OnboardingNextButton(
    final: Boolean,
    enabled: Boolean,
    expanded: Boolean = false,
    busy: Boolean = false,
    onClick: () -> Unit,
) {
    val busyLabel = stringResource(R.string.auth_busy)
    val style = TextStyle(fontSize = 17.sp, fontWeight = FontWeight.SemiBold)
    val measure = rememberTextMeasurer()
    val density = LocalDensity.current
    val short = with(density) { measure.measure(AnnotatedString("Далее"), style).size.width.toDp() }
    val long =
        with(density) { measure.measure(AnnotatedString("Попробовать"), style).size.width.toDp() }
    val titleHeight = with(density) {
        measure.measure(AnnotatedString("Попробовать"), style).size.height.toDp()
    }
    val animated by animateFloatAsState(
        if (final) 1f else 0f,
        spring(dampingRatio = 1f, stiffness = 400f),
        label = "next-morph",
    )
    val progress = if (LocalMotionEnabled.current) {
        animated
    } else if (final) {
        1f
    } else {
        0f
    }
    val background = androidx.compose.ui.graphics.lerp(Palette.surface, Palette.action, progress)
    val foreground = androidx.compose.ui.graphics.lerp(Palette.text, Palette.actionText, progress)
    Box(
        if (expanded) Modifier.fillMaxWidth() else Modifier.width(long + 80.dp),
        contentAlignment = Alignment.CenterEnd,
    ) {
        Surface(
            onClick = onClick,
            enabled = enabled && !busy,
            shape = CircleShape,
            color = background,
            contentColor = foreground,
            modifier = if (expanded) Modifier.fillMaxWidth() else Modifier,
        ) {
            Box(contentAlignment = Alignment.Center) {
                Row(
                    Modifier.alpha(
                        if (busy) 0f else 1f,
                    ).padding(horizontal = 23.dp, vertical = 16.dp)
                        .clearAndSetSemantics {
                            contentDescription = if (final) "Попробовать" else "Далее"
                            stateDescription = if (busy) busyLabel else ""
                        },
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(
                        12.dp,
                        Alignment.CenterHorizontally,
                    ),
                ) {
                    Box(Modifier.width(short + (long - short) * progress).height(titleHeight)) {
                        Text(
                            "Далее",
                            Modifier.requiredWidth(short).align(Alignment.Center).alpha(
                                1 - progress,
                            ),
                            style = style,
                        )
                        Text(
                            "Попробовать",
                            Modifier.requiredWidth(long).align(Alignment.Center).alpha(progress),
                            style = style,
                        )
                    }
                    AppIcon(R.drawable.ic_arrow, tint = foreground)
                }
                if (busy) {
                    CircularProgressIndicator(
                        Modifier.size(22.dp),
                        color = foreground,
                        strokeWidth = 2.dp,
                    )
                }
            }
        }
    }
}
