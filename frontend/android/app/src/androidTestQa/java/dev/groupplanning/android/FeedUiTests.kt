package dev.groupplanning.android

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performScrollToNode
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.performTextReplacement
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.lifecycle.Lifecycle
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Rule
import org.junit.Test

class FeedUiTests {
    @get:Rule val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    private var keyboardPreference: String? = null

    @Before fun configure() {
        fixture.configure()
        keyboardPreference = fixture.shell("settings get secure show_ime_with_hard_keyboard").trim()
        fixture.shell("settings put secure show_ime_with_hard_keyboard 1")
    }

    @After fun restoreKeyboardPreference() {
        keyboardPreference?.let {
            if (it == "null") {
                fixture.shell("settings delete secure show_ime_with_hard_keyboard")
            } else {
                require(it == "0" || it == "1")
                fixture.shell("settings put secure show_ime_with_hard_keyboard $it")
            }
        }
    }

    @Test fun historySendRetryInformationAndSettingsFollowSharedDesign() {
        fixture.launch("feed-owner", "RERERERERERERERERERERA").use { activity ->
            fixture.waitTag("message-composer")
            fixture.waitText("Я захвачу настолки. Пиццу закажем, когда соберёмся?")
            fixture.screenshot("feed-latest")
            compose.onNodeWithTag("feed-timeline").performScrollToNode(hasTestTag("feed-history"))
            val before = compose.onNodeWithTag("feed-entry-9").fetchSemanticsNode().boundsInRoot.top
            compose.onNodeWithTag("feed-history").performClick()
            compose.waitUntil(10_000) {
                compose.onAllNodes(hasTestTag("feed-history")).fetchSemanticsNodes().isEmpty()
            }
            val after = compose.onNodeWithTag("feed-entry-9").fetchSemanticsNode().boundsInRoot.top
            assertEquals(before, after, 3f)
            fixture.screenshot("feed-history")
            compose.onNodeWithTag("feed-end").performClick()
            compose.onNodeWithTag("message-composer").performClick()
                .performTextInput("Я принесу настолки")
            compose.waitUntil(10_000) {
                var visible = false
                var keyboardTop = 0
                activity.onActivity {
                    val insets = ViewCompat.getRootWindowInsets(it.window.decorView)
                    visible = insets?.isVisible(WindowInsetsCompat.Type.ime()) == true
                    keyboardTop = fixture.device.displayHeight -
                        (insets?.getInsets(WindowInsetsCompat.Type.ime())?.bottom ?: 0)
                }
                val bottom = compose.onNodeWithTag("message-send")
                    .fetchSemanticsNode().boundsInWindow.bottom
                val gap = keyboardTop - bottom
                visible && gap in 0f..(48 * fixture.context.resources.displayMetrics.density)
            }
            compose.onNodeWithContentDescription("Информация о встрече").assertIsDisplayed()
            compose.onNodeWithTag("message-send").assertIsDisplayed()
            fixture.screenshot("feed-keyboard")
            compose.onNodeWithTag("message-send").performClick()
            fixture.waitTag("message-retry")
            fixture.screenshot("feed-retry")
            activity.recreate()
            fixture.waitTag("message-retry")
            compose.onNodeWithTag("message-retry").performClick()
            compose.waitUntil(10_000) {
                compose.onAllNodes(hasTestTag("message-pending")).fetchSemanticsNodes().isEmpty()
            }
            fixture.screenshot("feed-sent")
            compose.onNodeWithTag("message-composer").performTextInput("Черновик после возврата")
            activity.moveToState(Lifecycle.State.CREATED)
            activity.moveToState(Lifecycle.State.RESUMED)
            compose.onNodeWithTag("message-composer").assertTextContains("Черновик после возврата")
            fixture.device.pressBack()
            compose.onNodeWithContentDescription("Информация о встрече").performClick()
            fixture.waitTag("invitation-people")
            fixture.screenshot("feed-information")
            compose.onNodeWithTag("open-settings").performScrollTo().performClick()
            fixture.waitTag("meeting-settings")
            compose.onNodeWithContentDescription("Название").performTextReplacement("Моя встреча")
            activity.recreate()
            fixture.waitTag("meeting-settings")
            compose.onNodeWithContentDescription("Название").assertTextContains("Моя встреча")
            compose.onNodeWithTag("settings-save").performScrollTo().performClick()
            fixture.waitTag("settings-reload")
            compose.onNodeWithTag("settings-reload").performScrollTo()
            fixture.screenshot("feed-settings-conflict")
            compose.onNodeWithTag("settings-reload").performScrollTo().performClick()
            compose.waitUntil(10_000) {
                compose.onNodeWithContentDescription("Название").fetchSemanticsNode()
                    .config[androidx.compose.ui.semantics.SemanticsProperties.EditableText].text ==
                    "Моя встреча"
            }
            compose.onNodeWithContentDescription(
                "Название",
            ).performScrollTo().performTextReplacement("Вечер настолок")
            compose.onNodeWithTag("settings-save").performScrollTo().performClick()
            fixture.waitText("Вечер настолок")
            fixture.screenshot("feed-settings-saved")
        }
    }

    @Test fun largeTextKeepsComposerAndInformationReachable() {
        val original = fixture.shell("settings get system font_scale").trim()
        try {
            fixture.shell("settings put system font_scale 1.8")
            fixture.launch("invite-owner", fixture.token).use {
                fixture.waitTag("message-composer")
                compose.onNodeWithTag("message-composer").assertIsDisplayed()
                compose.onNodeWithContentDescription("Информация о встрече").performClick()
                fixture.waitTag("invitation-people")
                compose.onNodeWithTag("invitation-people").performScrollTo().assertIsDisplayed()
                fixture.screenshot("feed-large-text-info")
                fixture.device.pressBack()
                fixture.waitTag("message-composer")
                fixture.screenshot("feed-large-text")
            }
        } finally {
            if (original == "null") {
                fixture.shell("settings delete system font_scale")
            } else {
                require(original.toFloatOrNull() != null)
                fixture.shell("settings put system font_scale $original")
            }
        }
    }
}
