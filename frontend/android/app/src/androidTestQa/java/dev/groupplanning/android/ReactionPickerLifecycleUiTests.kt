package dev.groupplanning.android

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.layout.boundsInWindow
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.UiDevice
import dev.groupplanning.android.data.api.models.ApiInstant
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.data.api.models.ServerCounter
import dev.groupplanning.android.data.api.models.UserProfile
import dev.groupplanning.android.ui.feed.ReactionPicker
import dev.groupplanning.android.ui.motion.LocalMotionEnabled
import dev.groupplanning.android.ui.theme.SomewhereTheme
import java.util.UUID
import kotlinx.serialization.json.JsonObject
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class ReactionPickerLifecycleUiTests {
    @get:Rule val compose = createComposeRule()

    @Test fun fullExitDisposesModeAndReopensQuickAtItsMeasuredAnchor() {
        val open = mutableStateOf(false)
        val bounds = mutableStateOf(Rect.Zero)
        var closed = 0
        val entry = FeedEntry(
            UUID(0, 1), UUID(0, 2), ServerCounter("1"), "message", 1,
            UserProfile(UUID(0, 3), "Участник"), ApiInstant("2026-10-27T12:00:00Z"),
            JsonObject(emptyMap()), null,
        )
        compose.setContent {
            SomewhereTheme {
                CompositionLocalProvider(LocalMotionEnabled provides false) {
                    Box(
                        Modifier.fillMaxSize().onGloballyPositioned {
                            bounds.value =
                                it.boundsInWindow()
                        },
                    ) {
                        val area = bounds.value
                        val anchor = Rect(
                            area.center.x,
                            area.height * 0.7f,
                            area.right,
                            area.height * 0.8f,
                        )
                        ReactionPicker(
                            entry,
                            emptySet(),
                            area,
                            anchor,
                            open.value,
                            {},
                            { open.value = false },
                            { closed += 1 },
                        )
                    }
                }
            }
        }
        compose.runOnIdle { open.value = true }
        val original = compose.onNodeWithTag("reaction-quick").fetchSemanticsNode().boundsInWindow
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val more = instrumentation.targetContext.getString(R.string.reaction_more)
        compose.onNodeWithContentDescription(more).performClick()
        compose.onNodeWithTag("reaction-full").assertExists()
        UiDevice.getInstance(instrumentation).pressBack()
        compose.waitUntil(5_000) { closed == 1 }
        compose.onNodeWithTag("reaction-full").assertDoesNotExist()
        compose.runOnIdle { open.value = true }
        compose.onNodeWithTag("reaction-full").assertDoesNotExist()
        val reopened = compose.onNodeWithTag("reaction-quick").fetchSemanticsNode().boundsInWindow
        assertEquals(original, reopened)
        val device = UiDevice.getInstance(instrumentation)
        device.click(bounds.value.left.toInt() + 1, bounds.value.bottom.toInt() - 1)
        compose.waitUntil(5_000) { closed == 2 }
        compose.onNodeWithTag("reaction-quick").assertDoesNotExist()
    }
}
