package dev.groupplanning.android

import android.os.ParcelFileDescriptor
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.assertIsFocused
import androidx.compose.ui.test.click
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.performTouchInput
import androidx.test.platform.app.InstrumentationRegistry
import dev.groupplanning.android.qaCreateComposeRule as createComposeRule
import dev.groupplanning.android.state.feed.MessageState
import dev.groupplanning.android.ui.feed.ChatPresentation
import dev.groupplanning.android.ui.feed.LocalChatPresentation
import dev.groupplanning.android.ui.feed.MessageComposer
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.SomewhereTheme
import java.io.File
import org.json.JSONObject
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

/**
 * Real key events complement IME semantics: an upstream draft echo must not replace local input.
 */
class ComposerTypingUiTests {
    @get:Rule(order = 0)
    val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule(order = 1)
    val compose = createComposeRule()
    private val fixture = InvitationUiFixture(compose)
    private val environment = ChatSheetEnvironment(fixture)

    @Before fun configure() {
        fixture.configure()
        environment.prepare()
    }

    @After fun restore() = environment.restore()

    @Test fun delayedUpstreamEchoKeepsNewerLocalTextAndNextInsertion() {
        val messages = mutableStateOf(MessageState(ready = true))
        val edits = mutableListOf<String>()
        compose.setContent {
            SomewhereTheme {
                CompositionLocalProvider(LocalChatPresentation provides ChatPresentation()) {
                    Box(Modifier.fillMaxSize()) {
                        MessageComposer(
                            messages.value,
                            { edits += it },
                            {},
                            {},
                            {},
                            {},
                            DesignTokens.componentEmojiDockPreferredHeight,
                        )
                    }
                }
            }
        }
        val input = compose.onNodeWithTag("message-composer")
        input.performTextInput("1")
        input.performTextInput("2")
        assertEquals("12", editableText("message-composer"))
        fixture.screenshot("composer-typing-before-delayed-echo")
        compose.runOnIdle { messages.value = messages.value.copy(draft = "1") }
        compose.waitForIdle()
        val afterEcho = editableText("message-composer")
        fixture.screenshot("composer-typing-after-delayed-echo")
        input.performTextInput("3")
        val afterThird = editableText("message-composer")
        fixture.screenshot("composer-typing-after-next-insertion")
        record(
            "composer-delayed-echo",
            "12|123",
            "$afterEcho|$afterThird",
            "Local edits ${edits.joinToString()}; upstream publishes only the older draft 1",
        )
        assertEquals(
            "Delayed upstream echo replaced newer local input or its insertion position",
            listOf("12", "123"),
            listOf(afterEcho, afterThird),
        )
    }

    @Test fun rapidHardwareTypingPreservesEveryCharacterInStockChat() {
        fixture.launch("design").use {
            fixture.waitText("Настолки у Саши")
            compose.onNodeWithText("Настолки у Саши").performScrollTo().performClick()
            fixture.waitTag("message-composer")
            val input = compose.onNodeWithTag("message-composer")
            assertEquals("", editableText("message-composer"))
            input.performTouchInput { click() }
            input.assertIsFocused()
            waitForKeyboard()
            fixture.screenshot("composer-hardware-empty-focused")
            injectRapidDigits()
            fixture.screenshot("composer-hardware-after-rapid-input")
            val actual = editableText("message-composer")
            record("composer-hardware-rapid", DIGITS, actual, "Stock design chat; input text")
            assertEquals("Stock chat lost or reordered a hardware input character", DIGITS, actual)
        }
    }

    @Test fun sameHardwareTypingPreservesEveryCharacterInSupport() {
        fixture.launch("calendar").use {
            fixture.waitTag("meetings-list")
            compose.onNodeWithTag("home-profile").performClick()
            fixture.waitText("Вход через Яндекс ID")
            compose.onNodeWithText("Сообщить о проблеме").performScrollTo().performClick()
            fixture.waitTag("support-description")
            val input = compose.onNodeWithTag("support-description")
            assertEquals("", editableText("support-description"))
            input.performTouchInput { click() }
            input.assertIsFocused()
            waitForKeyboard()
            fixture.screenshot("support-hardware-empty-focused")
            injectRapidDigits()
            fixture.screenshot("support-hardware-after-rapid-input")
            val actual = editableText("support-description")
            record("support-hardware-rapid", DIGITS, actual, "Stock support; identical input text")
            assertEquals(
                "Support control lost or reordered a hardware input character",
                DIGITS,
                actual,
            )
        }
    }

    private fun injectRapidDigits() {
        val automation = InstrumentationRegistry.getInstrumentation().uiAutomation
        ParcelFileDescriptor.AutoCloseInputStream(
            automation.executeShellCommand("input text $DIGITS"),
        ).bufferedReader().use { it.readText() }
        compose.waitForIdle()
    }

    private fun waitForKeyboard() {
        compose.waitUntil(10_000) { environment.keyboardBounds() != null }
    }

    private fun editableText(tag: String): String = compose.onNodeWithTag(tag)
        .fetchSemanticsNode().config[SemanticsProperties.EditableText].text

    private fun record(name: String, expected: String, actual: String, method: String) {
        val output = checkNotNull(
            InstrumentationRegistry.getArguments().getString("additionalTestOutputDir"),
        )
        val result = JSONObject().apply {
            put("expected", expected)
            put("actual", actual)
            put("method", method)
        }
        File(output, "$name.json").writeText(result.toString(2) + "\n")
        println("SOMEWHERE_TYPING_RESULT=$result")
    }

    private companion object {
        const val DIGITS = "1234567890123456789012345678901234567890"
    }
}
