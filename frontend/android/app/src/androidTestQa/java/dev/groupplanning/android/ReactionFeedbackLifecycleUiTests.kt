package dev.groupplanning.android

import androidx.compose.foundation.layout.size
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.MotionDurationScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performTouchInput
import dev.groupplanning.android.ui.feed.ReactionChoice
import dev.groupplanning.android.ui.motion.LocalMotionEnabled
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.SomewhereTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalTestApi::class)
class ReactionFeedbackLifecycleUiTests {
    @get:Rule val compose = createComposeRule(
        effectContext = object : MotionDurationScale {
            override val scaleFactor = 1f
        },
    )

    @Test fun normalPressHasIntermediateScaleAndRestoresOnRelease() {
        host(motion = true)
        val initial = width()
        compose.onNodeWithTag("choice").performTouchInput { down(center) }
        advance(48)
        val intermediate = width()
        assertTrue(intermediate < initial)
        assertTrue(intermediate > initial * DesignTokens.componentReactionPickerPressedScale)
        advance(200)
        assertEquals(initial * DesignTokens.componentReactionPickerPressedScale, width(), 1f)
        compose.onNodeWithTag("choice").performTouchInput { up() }
        advance(200)
        assertEquals(initial, width(), 1f)
    }

    @Test fun reducedPressDoesNotScaleTheChoice() {
        host(motion = false)
        val initial = width()
        compose.onNodeWithTag("choice").performTouchInput { down(center) }
        advance(200)
        assertEquals(initial, width(), 1f)
        compose.onNodeWithTag("choice").performTouchInput { up() }
    }

    private fun host(motion: Boolean) {
        compose.mainClock.autoAdvance = false
        compose.setContent {
            SomewhereTheme {
                CompositionLocalProvider(LocalMotionEnabled provides motion) {
                    ReactionChoice(
                        "👍",
                        false,
                        {},
                        Modifier.size(DesignTokens.targetAndroid).testTag("choice"),
                    )
                }
            }
        }
        advance(32)
    }

    private fun width(): Float = compose.onNodeWithTag("choice")
        .fetchSemanticsNode().boundsInWindow.width

    private fun advance(millis: Long) {
        repeat(((millis + 15) / 16).toInt()) {
            compose.mainClock.advanceTimeByFrame()
            compose.waitForIdle()
        }
    }
}
