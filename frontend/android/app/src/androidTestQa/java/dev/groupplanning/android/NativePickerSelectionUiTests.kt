package dev.groupplanning.android

import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.test.performTextReplacement
import androidx.compose.ui.text.TextRange
import androidx.test.uiautomator.By
import androidx.test.uiautomator.Until
import dev.groupplanning.android.qaCreateEmptyComposeRule as createEmptyComposeRule
import java.util.regex.Pattern
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class NativePickerSelectionUiTests {
    @get:Rule(order = 0)
    val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule(order = 1)
    val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Before fun configure() = fixture.configure()

    @Test fun initialPickerCancellationsKeepSelectedRange() {
        fixture.launch("design").use {
            fixture.waitText("Настолки у Саши")
            compose.onNodeWithText("Настолки у Саши").performScrollTo().performClick()
            val input = compose.onNodeWithTag("message-composer")
            input.performClick().performTextReplacement("До XX после")
            input.performSemanticsAction(SemanticsActions.SetSelection) { it(3, 5, false) }
            val range = SemanticsMatcher.expectValue(
                SemanticsProperties.TextSelectionRange,
                TextRange(3, 5),
            )
            input.assert(range)
            fixture.screenshot("native-picker-selected-range")
            for ((tag, packages) in listOf(
                "add-file" to ".*documentsui.*",
                "add-photo" to ".*(?:photopicker|providers\\.media).*",
            )) {
                repeat(3) { attempt ->
                    compose.onNodeWithTag("meeting-add").performClick()
                    compose.onNodeWithTag(tag).performClick()
                    assertTrue(
                        fixture.device.wait(
                            Until.hasObject(By.pkg(Pattern.compile(packages))),
                            10_000,
                        ),
                    )
                    compose.onNodeWithTag("upload-sheet").assertDoesNotExist()
                    fixture.device.pressBack()
                    fixture.waitTag("meeting-add")
                    compose.onNodeWithTag("upload-sheet").assertDoesNotExist()
                    input.assertTextContains("До XX после").assert(range)
                    println("NATIVE_PICKER_RANGE kind=$tag cancel=${attempt + 1} range=3..5")
                }
            }
            fixture.screenshot("native-picker-cancel-range-preserved")
        }
    }
}
