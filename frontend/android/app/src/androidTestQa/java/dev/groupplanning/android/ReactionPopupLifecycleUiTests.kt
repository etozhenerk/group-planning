package dev.groupplanning.android

import android.graphics.Bitmap
import android.view.View
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.MotionDurationScale
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.layout.boundsInWindow
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.dp
import androidx.test.platform.app.InstrumentationRegistry
import dev.groupplanning.android.ui.feed.ReactionPopup
import dev.groupplanning.android.ui.motion.LocalMotionEnabled
import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalTestApi::class)
class ReactionPopupLifecycleUiTests {
    @get:Rule val compose = createComposeRule(
        effectContext = object : MotionDurationScale {
            override val scaleFactor = 1f
        },
    )

    private val open = mutableStateOf(false)
    private val full = mutableStateOf(false)
    private val bounds = mutableStateOf(Rect.Zero)
    private var popupView: View? = null
    private var closed = 0

    @Test fun normalEnterAndExitHaveIntermediateFramesAndRetainContent() {
        host(motion = true)
        compose.runOnIdle { open.value = true }
        advance(80)
        val entering = redIntensity("normal-enter")
        println("REACTION_PROBE enter intensity=$entering")
        assertTrue(
            "Normal enter must have an intermediate frame: $entering",
            entering in 0.01f..0.99f,
        )
        advance(300)
        assertTrue(redIntensity("normal-visible") > 0.99f)
        compose.runOnIdle { open.value = false }
        advance(64)
        compose.onNodeWithTag("reaction-probe").assertExists()
        val exiting = redIntensity("normal-exit")
        println("REACTION_PROBE exit intensity=$exiting closed=$closed")
        assertTrue(
            "Normal exit must retain an intermediate frame: $exiting",
            exiting in 0.01f..0.99f,
        )
        assertEquals(0, closed)
        advance(300)
        compose.onNodeWithTag("reaction-probe").assertDoesNotExist()
        assertEquals(1, closed)
    }

    @Test fun reducedTransitionIsImmediateAfterLayoutAndClosesOnce() {
        host(motion = false)
        compose.runOnIdle { open.value = true }
        advance(32)
        assertTrue(redIntensity("reduced-visible") > 0.99f)
        compose.runOnIdle { open.value = false }
        advance(32)
        compose.onNodeWithTag("reaction-probe").assertDoesNotExist()
        assertEquals(1, closed)
    }

    @Test fun resizingContentDoesNotReframeThePopupWindow() {
        host(motion = false)
        compose.runOnIdle { open.value = true }
        advance(32)
        val quickWindow = windowBounds()
        compose.runOnIdle { full.value = true }
        advance(16)
        val fullWindow = windowBounds()
        println("REACTION_PROBE quickWindow=$quickWindow fullWindow=$fullWindow")
        assertEquals(
            "An old buffer must not be moved by a WindowManager resize",
            quickWindow,
            fullWindow,
        )
        val content = compose.onNodeWithTag("reaction-probe").fetchSemanticsNode().boundsInWindow
        assertTrue(
            "Full content must stay in the conversation",
            bounds.value.contains(content.topLeft),
        )
        assertTrue(content.bottom <= bounds.value.bottom)
    }

    private fun host(motion: Boolean) {
        compose.mainClock.autoAdvance = false
        compose.setContent {
            CompositionLocalProvider(LocalMotionEnabled provides motion) {
                Box(
                    Modifier.fillMaxSize().background(Color.Black).onGloballyPositioned {
                        bounds.value = it.boundsInWindow()
                    },
                ) {
                    val area = bounds.value
                    val anchor = Rect(
                        area.left + area.width / 4,
                        area.top + area.height * 0.65f,
                        area.left + area.width / 2,
                        area.top + area.height * 0.65f + 80,
                    )
                    ReactionPopup(
                        area,
                        anchor,
                        open.value,
                        { open.value = false },
                        { closed += 1 },
                    ) {
                        val view = LocalView.current
                        SideEffect { popupView = view.rootView }
                        Box(
                            Modifier.size(
                                if (full.value) 300.dp else 120.dp,
                                if (full.value) 300.dp else 56.dp,
                            ).background(Color.Red).testTag("reaction-probe"),
                        )
                    }
                }
            }
        }
        advance(32)
    }

    private fun advance(millis: Long) {
        repeat(((millis + 15) / 16).toInt()) {
            compose.mainClock.advanceTimeByFrame()
            // Popup owns a separate Android view tree; drain its layout for each test frame.
            compose.waitForIdle()
        }
    }

    private fun redIntensity(name: String): Float {
        val image = compose.onNodeWithTag("reaction-probe").captureToImage()
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val directory = File(context.getExternalFilesDir(null), "reaction-probe").apply { mkdirs() }
        File(directory, "$name.png").outputStream().use {
            image.asAndroidBitmap().compress(Bitmap.CompressFormat.PNG, 100, it)
        }
        val pixels = image.toPixelMap()
        val color = pixels[pixels.width / 2, pixels.height / 2]
        println("REACTION_PROBE $name size=${image.width}x${image.height} center=$color")
        return color.red
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
}
