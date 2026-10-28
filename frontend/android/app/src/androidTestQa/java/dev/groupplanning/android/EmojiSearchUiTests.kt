package dev.groupplanning.android

import android.animation.ValueAnimator
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsFocused
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.assertTextEquals
import androidx.compose.ui.test.click
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.performTextReplacement
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.swipeUp
import androidx.compose.ui.text.TextRange
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.test.core.app.ActivityScenario
import androidx.test.uiautomator.By
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class EmojiSearchUiTests {
    @get:Rule val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    private val animationSettings = listOf(
        "window_animation_scale",
        "transition_animation_scale",
        "animator_duration_scale",
    )
    private var originalSettings = emptyMap<String, String>()

    @Before fun configure() {
        fixture.configure()
        originalSettings = animationSettings.associateWith {
            fixture.shell("settings get global $it").trim()
        }
        animationSettings.forEach { fixture.shell("settings put global $it 1") }
        compose.waitUntil(5_000) { ValueAnimator.areAnimatorsEnabled() }
    }

    @After fun restore() {
        originalSettings.forEach { (key, value) ->
            if (value == "null") {
                fixture.shell("settings delete global $key")
            } else {
                require(value.toFloatOrNull() != null)
                fixture.shell("settings put global $key $value")
            }
            check(fixture.shell("settings get global $key").trim() == value)
        }
    }

    @Test fun searchTouchKeepsFocusWhenKeyboardResizesDock() {
        fixture.launch("design").use { activity ->
            fixture.waitText("Настолки у Саши")
            compose.onNodeWithText("Настолки у Саши").performScrollTo().performClick()
            fixture.waitTag("message-composer")
            val composer = compose.onNodeWithTag("message-composer")
            composer.performTextReplacement("Черновик ")
            compose.onNodeWithTag("emoji-open").performTouchInput { click() }
            fixture.waitTag("emoji-dock")
            val search = compose.onNodeWithTag("emoji-search")
            search.assertIsDisplayed()
            fixture.screenshot("search-before-touch")
            search.performTouchInput { click() }
            fixture.screenshot("search-after-touch")
            search.assertIsFocused()
            waitForKeyboard(activity, true)
            search.performTextInput("пицца")
            search.assertIsFocused().assertTextContains("пицца")
            search.assert(
                SemanticsMatcher.expectValue(
                    SemanticsProperties.TextSelectionRange,
                    TextRange(5),
                ),
            )
            fixture.screenshot("search-keyboard-results")
            activity.onActivity {
                WindowCompat.getInsetsController(it.window, it.window.decorView)
                    .hide(WindowInsetsCompat.Type.ime())
            }
            waitForKeyboard(activity, false)
            search.assertIsFocused().assertTextContains("пицца")
            search.performTouchInput { click() }
            waitForKeyboard(activity, true)
            search.performTextInput(" ")
            search.assert(
                SemanticsMatcher.expectValue(
                    SemanticsProperties.TextSelectionRange,
                    TextRange(6),
                ),
            )
            compose.onNodeWithTag("emoji-grid").performTouchInput { swipeUp() }
            search.assertIsFocused()
            compose.onNodeWithText("🍕").assertIsDisplayed().performTouchInput { click() }
            composer.assertTextContains("Черновик 🍕")
            fixture.screenshot("search-selected-pizza")
            compose.onNodeWithTag("emoji-open").performTouchInput { click() }
            fixture.waitAbsent("emoji-dock")
            composer.assertIsFocused()
            waitForKeyboard(activity, true)
            composer.assert(
                SemanticsMatcher.expectValue(
                    SemanticsProperties.TextSelectionRange,
                    TextRange("Черновик 🍕".length),
                ),
            )
            composer.performTextInput("!")
            composer.assertTextEquals("Черновик 🍕!")
            fixture.screenshot("search-returned-to-composer")
        }
    }

    @Test fun rapidOpeningTouchesDoNotInsertAnEmoji() {
        fixture.launch("design").use {
            fixture.waitText("Настолки у Саши")
            compose.onNodeWithText("Настолки у Саши").performScrollTo().performClick()
            fixture.waitTag("message-composer")
            val composer = compose.onNodeWithTag("message-composer")
            composer.performTextReplacement("Без случайных эмодзи")
            val button = requireNotNull(
                fixture.device.findObject(
                    By.desc(fixture.context.getString(R.string.emoji_choose)),
                ),
            )
            val bounds = button.visibleBounds
            fixture.device.click(bounds.centerX(), bounds.centerY())
            Thread.sleep(80)
            fixture.device.click(bounds.centerX(), bounds.centerY())
            fixture.screenshot("rapid-opening-touches")
            composer.assertTextEquals("Без случайных эмодзи")
        }
    }

    private fun waitForKeyboard(activity: ActivityScenario<MainActivity>, visible: Boolean) {
        compose.waitUntil(5_000) {
            var matches = false
            activity.onActivity {
                matches = ViewCompat.getRootWindowInsets(it.window.decorView)
                    ?.isVisible(WindowInsetsCompat.Type.ime()) == visible
            }
            matches
        }
    }
}
