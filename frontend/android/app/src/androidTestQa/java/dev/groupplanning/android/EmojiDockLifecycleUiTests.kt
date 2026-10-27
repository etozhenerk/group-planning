package dev.groupplanning.android

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.MotionDurationScale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.click
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.ui.feed.EmojiDock
import dev.groupplanning.android.ui.motion.LocalMotionEnabled
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalTestApi::class)
class EmojiDockLifecycleUiTests {
    @get:Rule val compose = createComposeRule(
        effectContext = object : MotionDurationScale {
            override val scaleFactor = 1f
        },
    )

    private val open = mutableStateOf(false)
    private var clicks = 0

    @Test fun normalDockRetainsInertExitAndReversesFromCurrentHeight() {
        host(motion = true)
        compose.runOnIdle { open.value = true }
        advance(80)
        val enteringHeight = height()
        val enteringIntensity = intensity()
        println("DOCK_PROBE enteringHeight=$enteringHeight intensity=$enteringIntensity")
        assertTrue(enteringIntensity in 0.01f..0.99f)
        advance(300)
        val fullHeight = height()
        println("DOCK_PROBE fullHeight=$fullHeight")
        assertTrue(enteringHeight > 0 && enteringHeight < fullHeight)
        assertTrue(intensity() > 0.99f)
        compose.runOnIdle { open.value = false }
        advance(32)
        compose.onNodeWithContentDescription("dock-action").assertDoesNotExist()
        compose.onNodeWithTag("dock-frame").performTouchInput { click(center) }
        assertEquals(0, clicks)
        advance(32)
        val exitingHeight = height()
        println("DOCK_PROBE exitingHeight=$exitingHeight intensity=${intensity()}")
        assertTrue(exitingHeight > 0 && exitingHeight < fullHeight)
        assertTrue(intensity() in 0.01f..0.99f)
        compose.runOnIdle { open.value = true }
        advance(16)
        assertTrue(height() > 0 && height() < fullHeight)
        advance(300)
        assertEquals(fullHeight, height(), 1f)
        compose.onNodeWithContentDescription("dock-action").assertExists()
        compose.runOnIdle { open.value = false }
        advance(300)
        compose.onNodeWithTag("dock-frame").assertDoesNotExist()
    }

    @Test fun reducedDockOpensAndDisposesImmediatelyAfterFrame() {
        host(motion = false)
        compose.runOnIdle { open.value = true }
        advance(16)
        val firstHeight = height()
        assertTrue(firstHeight > 0)
        assertTrue(intensity() > 0.99f)
        advance(200)
        assertEquals(firstHeight, height(), 1f)
        compose.runOnIdle { open.value = false }
        advance(16)
        compose.onNodeWithTag("dock-frame").assertDoesNotExist()
    }

    private fun host(motion: Boolean) {
        compose.mainClock.autoAdvance = false
        compose.setContent {
            CompositionLocalProvider(LocalMotionEnabled provides motion) {
                Box(Modifier.fillMaxSize().background(Color.Black)) {
                    EmojiDock(open.value, Modifier.testTag("dock-frame")) {
                        Box(
                            Modifier.size(200.dp).background(Color.Red)
                                .clickable { clicks += 1 }
                                .semantics { contentDescription = "dock-action" },
                        )
                    }
                }
            }
        }
        advance(32)
    }

    private fun height(): Float = compose.onNodeWithTag("dock-frame")
        .fetchSemanticsNode().boundsInWindow.height

    private fun intensity(): Float {
        val pixels = compose.onNodeWithTag("dock-frame").captureToImage().toPixelMap()
        return pixels[pixels.width / 2, pixels.height / 2].red
    }

    private fun advance(millis: Long) {
        repeat(((millis + 15) / 16).toInt()) {
            compose.mainClock.advanceTimeByFrame()
            compose.waitForIdle()
        }
    }
}
