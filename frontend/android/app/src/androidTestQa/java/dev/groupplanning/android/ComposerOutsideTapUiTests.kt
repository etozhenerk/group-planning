package dev.groupplanning.android

import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsFocused
import androidx.compose.ui.test.assertIsNotFocused
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.assertTextEquals
import androidx.compose.ui.test.click
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.longClick
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.performTextReplacement
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.swipeDown
import androidx.compose.ui.text.TextRange
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class ComposerOutsideTapUiTests {
    @get:Rule val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)
    private val environment = ChatSheetEnvironment(fixture)

    @Before fun configure() {
        fixture.configure()
        environment.prepare()
    }

    @After fun restore() = environment.restore()

    @Test fun backgroundMessageAndHeadingDismissImeAndKeepDraftSelection() {
        fixture.launch("design").use {
            openChat()
            val input = compose.onNodeWithTag("message-composer")
            focusDraft()
            fixture.screenshot("composer-outside-ime-visible")
            input.performTouchInput { click() }
            input.assertIsFocused()
            waitKeyboard(true)
            selectDraftRange()
            compose.onNodeWithTag("feed-timeline").performTouchInput {
                click(Offset(1f, centerY))
            }
            assertDismissedDraft()
            assertDraftRange()
            fixture.screenshot("composer-outside-background-ime-hidden")

            input.performTouchInput { click() }
            waitKeyboard(true)
            selectDraftRange()
            compose.onNodeWithText("Тогда беру две игры. И можно заказать пиццу!")
                .performScrollTo().performTouchInput { click() }
            assertDismissedDraft()
            assertDraftRange()
            fixture.screenshot("composer-outside-message-ime-hidden")

            input.performTouchInput { click() }
            waitKeyboard(true)
            selectDraftRange()
            compose.onNodeWithTag("meeting-heading").performTouchInput { click() }
            fixture.waitTag("meeting-information")
            waitKeyboard(false)
            fixture.screenshot("composer-outside-heading-first-tap")
            fixture.closeActionSheet()
            fixture.waitAbsent("chat-action-sheet")
            assertDismissedDraft()
            assertDraftRange()
            input.performTouchInput { click() }
            input.assertIsFocused()
            waitKeyboard(true)
            input.performTextInput("!")
            input.assertTextContains("!", substring = true)
        }
    }

    @Test fun sendAndAddActOnFirstTapAndSheetKeepsItsOwnInputFocus() {
        fixture.launch("design").use {
            openChat()
            val input = compose.onNodeWithTag("message-composer")
            focusDraft()
            input.performTextReplacement("Сообщение первым нажатием")
            compose.onNodeWithTag("message-send").performTouchInput { click() }
            compose.waitUntil(10_000) {
                input.fetchSemanticsNode().config[SemanticsProperties.EditableText].text.isEmpty()
            }
            fixture.waitText("Сообщение первым нажатием")
            input.assertIsNotFocused()
            waitKeyboard(false)
            compose.onAllNodesWithText("Сообщение первым нажатием").assertCountEquals(1)

            focusDraft()
            selectDraftRange()
            compose.onNodeWithTag("meeting-add").performTouchInput { click() }
            fixture.waitTag("new-place-poll")
            assertDismissedDraft()
            assertDraftRange()
            compose.onNodeWithTag("new-place-poll").performTouchInput { click() }
            fixture.waitTag("place-poll-place")
            val place = compose.onNodeWithTag("place-poll-place")
            place.performTouchInput { click() }
            place.performTextReplacement("Кафе у парка")
            waitKeyboard(true)
            place.assertIsFocused().assertTextEquals("Кафе у парка")
            fixture.screenshot("composer-outside-sheet-input-ime-visible")
            fixture.closeActionSheet()
            fixture.waitAbsent("chat-action-sheet")
            assertDismissedDraft()
            assertDraftRange()
            fixture.screenshot("composer-outside-sheet-return-ime-hidden")
        }
    }

    @Test fun emojiFirstTapKeepsSelectionAndSearchKeepsItsOwnKeyboard() {
        fixture.launch("design").use {
            openChat()
            focusDraft()
            selectDraftRange()
            compose.onNodeWithTag("emoji-open").performTouchInput { click() }
            fixture.waitTag("emoji-dock")
            assertDismissedDraft()
            assertDraftRange()
            val search = compose.onNodeWithTag("emoji-search")
            search.performTouchInput { click() }
            search.performTextInput("пицца")
            waitKeyboard(true)
            search.assertIsFocused().assertTextContains("пицца")
            fixture.screenshot("composer-outside-emoji-search-ime-visible")
            compose.onNodeWithText("🍕").performScrollTo().performTouchInput { click() }
            compose.onNodeWithTag("message-composer").assertTextEquals("До 🍕 после")
            compose.onNodeWithTag("emoji-open").performTouchInput { click() }
            fixture.waitAbsent("emoji-dock")
            compose.onNodeWithTag("message-composer").assertIsFocused().performTextInput("!")
            waitKeyboard(true)
            compose.onNodeWithTag("message-composer").assertTextEquals("До 🍕! после")
            fixture.screenshot("composer-outside-emoji-return-ime-visible")
        }
    }

    @Test fun scrollingAndLongPressKeepTheirGesturesAndDraft() {
        fixture.launch("design").use {
            openChat()
            focusDraft()
            compose.onNodeWithTag("feed-timeline").performTouchInput { swipeDown() }
            compose.onNodeWithTag("message-composer").assertIsFocused().assertTextEquals(DRAFT)
            waitKeyboard(true)
            compose.onNodeWithText("Тогда беру две игры. И можно заказать пиццу!")
                .performScrollTo().performTouchInput { longClick() }
            fixture.waitTag("reaction-quick")
            compose.onNodeWithTag("message-composer").assertTextEquals(DRAFT)
            fixture.screenshot("composer-outside-long-press-reaction")
            compose.onNodeWithText("👍").performTouchInput { click() }
            fixture.waitAbsent("reaction-quick")
            fixture.waitText("👍 1 ✓")
        }
    }

    private fun openChat() {
        fixture.waitText("Настолки у Саши")
        compose.onNodeWithText("Настолки у Саши").performScrollTo().performClick()
        fixture.waitTag("message-composer")
    }

    private fun focusDraft() {
        compose.onNodeWithTag("message-composer").performTouchInput { click() }
        compose.onNodeWithTag("message-composer").performTextReplacement(DRAFT)
        compose.onNodeWithTag("message-composer").assertIsFocused()
        waitKeyboard(true)
    }

    private fun selectDraftRange() {
        compose.onNodeWithTag("message-composer")
            .performSemanticsAction(SemanticsActions.SetSelection) { it(3, 5, false) }
        assertDraftRange()
    }

    private fun assertDraftRange() {
        compose.onNodeWithTag("message-composer").assert(
            SemanticsMatcher.expectValue(SemanticsProperties.TextSelectionRange, TextRange(3, 5)),
        )
    }

    private fun assertDismissedDraft() {
        waitKeyboard(false)
        compose.onNodeWithTag("message-composer").assertIsNotFocused().assertTextEquals(DRAFT)
    }

    private fun waitKeyboard(visible: Boolean) {
        compose.waitUntil(10_000) { (environment.keyboardBounds() != null) == visible }
    }

    private companion object {
        const val DRAFT = "До XX после"
    }
}
