package dev.groupplanning.android.ui.onboarding

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.CustomAccessibilityAction
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.customActions
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.setProgress
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.ui.theme.Palette
import kotlin.math.roundToInt

@Composable
internal fun OnboardingProgress(page: Int, enabled: Boolean, choose: (Int) -> Unit) {
    val active = Palette.accent
    val inactive = Palette.border
    Canvas(
        Modifier.size(150.dp, 48.dp).testTag("onboarding-progress").semantics {
            contentDescription = "Слайды знакомства"
            stateDescription = "${page + 1} из 5"
            progressBarRangeInfo = ProgressBarRangeInfo(page.toFloat(), 0f..4f, 3)
            setProgress {
                if (enabled) choose(it.toInt().coerceIn(0, 4))
                enabled
            }
            customActions = (0..4).map { index ->
                CustomAccessibilityAction("Слайд ${index + 1}") {
                    if (enabled) choose(index)
                    enabled
                }
            }
        }.pointerInput(enabled, choose) {
            detectTapGestures {
                if (enabled) {
                    val nearest = ((it.x - size.width / 2) / 17.dp.toPx()).roundToInt() + 2
                    choose(nearest.coerceIn(0, 4))
                }
            }
        },
    ) {
        repeat(5) { index ->
            drawCircle(
                if (index == page) active else inactive,
                3.5.dp.toPx(),
                Offset(size.width / 2 + (index - 2) * 17.dp.toPx(), size.height / 2),
            )
        }
    }
}
