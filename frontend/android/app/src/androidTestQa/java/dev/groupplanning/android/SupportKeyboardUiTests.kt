package dev.groupplanning.android

import android.view.KeyEvent
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotFocused
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.performTextReplacement
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.test.uiautomator.By
import java.util.regex.Pattern
import kotlin.math.abs
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class SupportKeyboardUiTests {
    @get:Rule val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Before fun configure() = fixture.configure()

    @Test fun donePreservesNewlinesAndShortMessageExplainsItsLimit() {
        fixture.launch("calendar").use { activity ->
            fixture.waitTag("meetings-list")
            compose.onNodeWithTag("home-profile").performClick()
            fixture.waitText("Яндекс ID")
            compose.onNodeWithText("Сообщить о проблеме").performScrollTo().performClick()
            fixture.waitTag("support-description")
            compose.onNodeWithTag("support-done").assertDoesNotExist()
            var statusBarBottom = 0
            activity.onActivity {
                statusBarBottom = checkNotNull(ViewCompat.getRootWindowInsets(it.window.decorView))
                    .getInsets(WindowInsetsCompat.Type.statusBars()).top
            }
            assertHeaderBelowStatusBar(statusBarBottom)
            val description = compose.onNodeWithTag("support-description")
            description.performClick()
            fixture.waitTag("support-done")
            fixture.screenshot("support-first-focus-insets")
            assertDoneTouchesKeyboard()
            assertHeaderBelowStatusBar(statusBarBottom)
            fixture.device.pressBack()
            fixture.waitAbsent("support-done")
            fixture.waitTag("support-description")
            description.performClick()
            fixture.waitTag("support-done")
            description.performTextInput("Строка 1")
            check(fixture.device.pressKeyCode(KeyEvent.KEYCODE_ENTER))
            description.performTextInput("Строка 2")
            description.assertTextContains("Строка 1\nСтрока 2")
            compose.onNodeWithTag("support-done").assertIsDisplayed().performClick()
            fixture.waitAbsent("support-done")
            description.assertIsNotFocused().assertTextContains("Строка 1\nСтрока 2")
            description.performClick().performTextReplacement("123456789")
            fixture.waitTag("support-done")
            compose.onNodeWithTag("support-done").performClick()
            fixture.waitAbsent("support-done")
            compose.onNodeWithText("Отправить обращение").performScrollTo().performClick()
            fixture.waitTag("support-description-error")
            compose.onNodeWithTag("support-description-error")
                .assertTextContains("Добавьте описание — хотя бы 10 символов.")
                .assertIsDisplayed()
            fixture.waitTag("support-done")
            fixture.screenshot("support-short-message-keyboard")
            assertDoneTouchesKeyboard()
            compose.onNodeWithTag("support-done").performClick()
            fixture.waitAbsent("support-done")
            description.performScrollTo().performClick().performTextReplacement("1234567890")
            fixture.waitTag("support-done")
            compose.onNodeWithTag("support-done").performClick()
            fixture.waitAbsent("support-done")
            compose.onNodeWithText("Отправить обращение").performScrollTo().performClick()
            fixture.waitText("Спасибо, что рассказали")
            compose.onNodeWithTag("support-done").assertDoesNotExist()
            compose.onNodeWithTag("support-success-back").performClick()
            fixture.waitAbsent("service-page")
            compose.onNodeWithTag("home-profile").assertIsSelected()
        }
    }

    private fun assertDoneTouchesKeyboard() {
        val done = checkNotNull(fixture.device.findObject(By.text("Готово")))
        val target = checkNotNull(done.parent)
        check(target.isClickable)
        val keyboard = fixture.device.findObjects(By.pkg(Pattern.compile(".*inputmethod.*")))
        check(keyboard.isNotEmpty())
        val keyboardTop = keyboard.minOf { it.visibleBounds.top }
        val gap = keyboardTop - target.visibleBounds.bottom
        assertTrue("Unexpected gap between Done and keyboard: $gap px", abs(gap) <= 2)
    }

    private fun assertHeaderBelowStatusBar(statusBarBottom: Int) {
        val brand = checkNotNull(fixture.device.findObject(By.text("somewhere")))
        val back = checkNotNull(fixture.device.findObject(By.text("Назад")))
        assertTrue("Brand is behind the status bar", brand.visibleBounds.top >= statusBarBottom)
        assertTrue("Back is behind the status bar", back.visibleBounds.top >= statusBarBottom)
    }
}
