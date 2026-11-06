package dev.groupplanning.android.ui.onboarding

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.CustomAccessibilityAction
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.customActions
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.setProgress
import androidx.compose.ui.semantics.stateDescription
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.theme.DesignTokens
import kotlin.math.floor

@Composable
internal fun OnboardingProgress(page: Int, enabled: Boolean, choose: (Int) -> Unit) {
    val count = OnboardingSlide.entries.size
    val currentChoose by rememberUpdatedState(choose)
    val label = stringResource(R.string.onboarding_pages_label)
    val value = stringResource(R.string.onboarding_pages, page + 1, count)
    val actionLabels = (0 until count).map {
        stringResource(R.string.onboarding_page_action, it + 1)
    }
    val select: (Float, Float) -> Unit = { x, width ->
        if (enabled) currentChoose(floor(x / width * count).toInt().coerceIn(0, count - 1))
    }
    Canvas(
        Modifier.size(
            DesignTokens.componentMobileOnboardingProgressSlotWidth * count,
            DesignTokens.targetAndroid,
        )
            .testTag("onboarding-progress").semantics {
                if (!enabled) disabled()
                contentDescription = label
                stateDescription = value
                progressBarRangeInfo =
                    ProgressBarRangeInfo(page.toFloat(), 0f..(count - 1).toFloat(), count - 2)
                setProgress {
                    if (enabled) currentChoose(it.toInt().coerceIn(0, count - 1))
                    enabled
                }
                customActions =
                    actionLabels.mapIndexed { index, title ->
                        CustomAccessibilityAction(title) {
                            if (enabled) currentChoose(index)
                            enabled
                        }
                    }
            }.pointerInput(enabled) { detectTapGestures { select(it.x, size.width.toFloat()) } }
            .pointerInput(enabled) {
                detectDragGestures { change, _ ->
                    change.consume()
                    select(change.position.x, size.width.toFloat())
                }
            },
    ) {
        repeat(count) { index ->
            val width = if (index ==
                page
            ) {
                DesignTokens.componentMobileOnboardingProgressSelectedWidth.toPx()
            } else {
                DesignTokens.componentMobileOnboardingProgressDotSize.toPx()
            }
            val height = DesignTokens.componentMobileOnboardingProgressDotSize.toPx()
            drawRoundRect(
                if (index ==
                    page
                ) {
                    DesignTokens.colorAccent
                } else {
                    DesignTokens.colorMobileOnboardingInactive
                },
                Offset((index + 0.5f) * size.width / count - width / 2, (size.height - height) / 2),
                Size(width, height),
                CornerRadius(height / 2),
            )
        }
    }
}
