package dev.groupplanning.android

import android.view.View
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.MotionDurationScale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.layout.boundsInWindow
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.click
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.ui.components.FloatingPanel
import dev.groupplanning.android.ui.feed.ChatPresentation
import dev.groupplanning.android.ui.feed.LocalChatPresentation
import dev.groupplanning.android.ui.feed.MeetingActions
import dev.groupplanning.android.ui.motion.LocalMotionEnabled
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.SomewhereTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalTestApi::class)
class ComposerMenuLifecycleUiTests {
    @get:Rule val compose = createComposeRule(
        effectContext = object : MotionDurationScale {
            override val scaleFactor = 1f
        },
    )

    private val open = mutableStateOf(false)
    private val presentation = ChatPresentation()
    private var popupView: View? = null
    private var clicks = 0

    @Test fun normalMenuFadesAndSlidesInsideStableWindowWithInertReversibleExit() {
        host(motion = true)
        compose.runOnIdle { open.value = true }
        advance(80)
        val enteringWindow = windowBounds()
        val entering = compose.onNodeWithContentDescription("menu-action")
            .fetchSemanticsNode().boundsInWindow
        println("MENU_PROBE enteringWindow=$enteringWindow content=$entering alpha=${intensity()}")
        assertTrue(intensity() in 0.01f..0.99f)
        advance(300)
        val settled = compose.onNodeWithContentDescription("menu-action")
            .fetchSemanticsNode().boundsInWindow
        println("MENU_PROBE settledWindow=${windowBounds()} content=$settled alpha=${intensity()}")
        assertTrue(entering.top > settled.top)
        assertEquals(entering.width, settled.width, 1f)
        assertEquals(enteringWindow, windowBounds())
        assertTrue(intensity() > 0.99f)
        compose.runOnIdle { open.value = false }
        advance(64)
        compose.onNodeWithContentDescription("menu-action").assertDoesNotExist()
        compose.onNodeWithTag("menu-frame").performTouchInput { click(center) }
        assertEquals(0, clicks)
        assertEquals(enteringWindow, windowBounds())
        assertTrue(intensity() in 0.01f..0.99f)
        println("MENU_PROBE exitWindow=${windowBounds()} alpha=${intensity()} clicks=$clicks")
        compose.runOnIdle { open.value = true }
        advance(16)
        assertTrue(intensity() in 0.01f..0.99f)
        advance(300)
        assertTrue(intensity() > 0.99f)
        assertEquals(enteringWindow, windowBounds())
        compose.runOnIdle { open.value = false }
        advance(300)
        compose.onNodeWithTag("menu-frame").assertDoesNotExist()
    }

    @Test fun reducedMenuHasNoIntermediateOpacityAndRemovesOnClose() {
        host(motion = false)
        compose.runOnIdle { open.value = true }
        advance(32)
        assertTrue(intensity() > 0.99f)
        compose.runOnIdle { open.value = false }
        advance(16)
        compose.onNodeWithTag("menu-frame").assertDoesNotExist()
    }

    @Test fun actionStartsImmediatelyWithoutWaitingForMenuExit() {
        host(motion = true, actualActions = true)
        compose.onNodeWithTag("meeting-add").performClick()
        advance(300)
        compose.onNodeWithTag("new-date-poll").performClick()
        assertEquals(1, clicks)
        assertEquals(false, open.value)
    }

    private fun host(motion: Boolean, actualActions: Boolean = false) {
        compose.mainClock.autoAdvance = false
        compose.setContent {
            SomewhereTheme {
                CompositionLocalProvider(
                    LocalMotionEnabled provides motion,
                    LocalChatPresentation provides presentation,
                ) {
                    Box(
                        Modifier.fillMaxSize().background(Color.Black).onGloballyPositioned {
                            presentation.conversationBounds = it.boundsInWindow()
                        },
                    ) {
                        Box(
                            Modifier.align(Alignment.BottomStart).size(DesignTokens.targetAndroid),
                        ) {
                            if (actualActions) {
                                MeetingActions(
                                    true,
                                    open.value,
                                    { open.value = it },
                                    {},
                                    {},
                                    { clicks += 1 },
                                    {},
                                    {},
                                )
                            } else {
                                FloatingPanel(
                                    open.value,
                                    { open.value = false },
                                    Modifier.testTag("menu-frame"),
                                ) {
                                    val view = LocalView.current
                                    SideEffect { popupView = view.rootView }
                                    Box(
                                        Modifier.size(200.dp).background(Color.Red)
                                            .clickable { clicks += 1 }
                                            .semantics { contentDescription = "menu-action" },
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
        advance(32)
    }

    private fun intensity(): Float {
        val pixels = compose.onNodeWithTag("menu-frame").captureToImage().toPixelMap()
        return pixels[pixels.width / 2, pixels.height / 2].red
    }

    private fun windowBounds(): List<Int> {
        var result = emptyList<Int>()
        compose.runOnIdle {
            val view = requireNotNull(popupView)
            val location = IntArray(2)
            view.getLocationOnScreen(location)
            result = listOf(location[0], location[1], view.width, view.height)
        }
        return result
    }

    private fun advance(millis: Long) {
        repeat(((millis + 15) / 16).toInt()) {
            compose.mainClock.advanceTimeByFrame()
            compose.waitForIdle()
        }
    }
}
