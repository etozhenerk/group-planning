package dev.groupplanning.android

import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertHeightIsAtLeast
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsFocused
import androidx.compose.ui.test.assertIsNotSelected
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.assertTextEquals
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.longClick
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.performTextReplacement
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.TextRange
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import dev.groupplanning.android.ui.theme.DesignTokens
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class TelegramChatUiTests {
    @get:Rule val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Before fun configure() = fixture.configure()

    @Test fun cardsKeepTheDateAndExplainUnspecifiedTimeWithoutClipping() {
        fixture.launch("design").use {
            fixture.waitText("Настолки у Саши")
            compose.onNodeWithText("Сб, 31 октября · 19:00", useUnmergedTree = true)
                .performScrollTo().assertIsDisplayed()
            val label = compose.onNodeWithText(
                "Вс, 8 ноября · время уточняем",
                useUnmergedTree = true,
            )
            label.performScrollTo().assertIsDisplayed()
            val layouts = mutableListOf<TextLayoutResult>()
            label.performSemanticsAction(SemanticsActions.GetTextLayoutResult) { it(layouts) }
            assertTrue("Date label must expose its rendered text layout", layouts.isNotEmpty())
            fixture.screenshot("telegram-untimed-meeting-card")
            assertFalse(
                "The full unspecified-time label must fit: " + layouts.map {
                    "size=${it.size}, lines=${it.lineCount}, " +
                        "widthOverflow=${it.didOverflowWidth}, heightOverflow=${it.didOverflowHeight}"
                },
                layouts.any {
                    it.hasVisualOverflow
                },
            )
        }
    }

    @Test fun dockReplacesSelectionRepeatsAndRestoresKeyboardCursor() {
        fixture.launch("design").use { activity ->
            openChat()
            val input = compose.onNodeWithTag("message-composer")
            input.performTextReplacement("До XX после")
            input.performSemanticsAction(SemanticsActions.SetSelection) { it(3, 5, false) }
            val selectedRange = SemanticsMatcher.expectValue(
                SemanticsProperties.TextSelectionRange,
                TextRange(3, 5),
            )
            input.assert(selectedRange)
            compose.onNodeWithTag("emoji-open").performClick()
            fixture.waitTag("emoji-dock")
            input.assert(selectedRange)
            compose.onNodeWithContentDescription("Лица и люди").assertIsSelected()
            compose.onNodeWithTag("emoji-search").performTextReplacement("пицца")
            listOf(
                "Недавние",
                "Лица и люди",
                "Природа",
                "Еда и напитки",
                "Места и поездки",
                "Предметы",
                "Символы",
            ).forEach { label ->
                compose.onNodeWithContentDescription(label).assertIsNotSelected()
            }
            input.assert(selectedRange)
            compose.onNodeWithText("🍕").performScrollTo().performClick()
            input.assertTextContains("До 🍕 после")
            compose.onNodeWithTag("emoji-dock").assertExists()
            compose.onNodeWithTag("emoji-search").performTextReplacement("сердце")
            compose.onNodeWithText("❤️").performScrollTo().performClick()
            input.assertTextContains("До 🍕❤️ после")
            compose.onNodeWithTag("emoji-open").performClick()
            input.assertIsFocused().performTextInput("!")
            input.assertTextContains("До 🍕❤️! после")
            compose.onNodeWithTag("emoji-open").performClick()
            activity.recreate()
            fixture.waitTag("emoji-dock")
            input.assertTextContains("До 🍕❤️! после")
            fixture.device.pressBack()
            fixture.waitAbsent("emoji-dock")
            compose.onNodeWithTag("emoji-open").assertIsFocused()
            compose.waitUntil(5_000) {
                var hidden = false
                activity.onActivity {
                    val insets = requireNotNull(ViewCompat.getRootWindowInsets(it.window.decorView))
                    hidden = !insets.isVisible(WindowInsetsCompat.Type.ime())
                }
                hidden
            }
            fixture.screenshot("telegram-dock-selection-back")
        }
    }

    @Test fun composerRejectsTextBeyondTheExistingMessageLimit() {
        fixture.launch("design").use {
            openChat()
            val input = compose.onNodeWithTag("message-composer")
            val accepted = "А".repeat(4000)
            input.performTextReplacement(accepted)
            input.performTextInput("!")
            input.assertTextEquals(accepted)
            compose.onNodeWithTag("emoji-open").performClick()
            fixture.waitTag("emoji-dock")
            compose.onNodeWithTag("emoji-search").performTextReplacement("пицца")
            compose.onNodeWithText("🍕").performScrollTo().performClick()
            input.assertTextEquals(accepted)
        }
    }

    @Test fun quickAndFullReactionsStayAtMessageAndReturnFocusToBubble() {
        fixture.launch("design").use {
            openChat()
            compose.onAllNodesWithContentDescription(
                fixture.context.getString(R.string.reaction_add),
            ).assertCountEquals(0)
            val opener = compose.onNodeWithText("Тогда беру две игры. И можно заказать пиццу!")
            opener.performTouchInput { longClick() }
            fixture.waitTag("reaction-quick")
            compose.onNodeWithContentDescription(fixture.context.getString(R.string.reaction_more))
                .performClick()
            fixture.waitTag("reaction-full")
            compose.onNodeWithTag("message-send").assertIsDisplayed()
            compose.onNodeWithTag("emoji-search").performTextReplacement("пицца")
            compose.onNodeWithText("🍕").performScrollTo().performClick()
            fixture.waitAbsent("reaction-full")
            opener.assertIsFocused()
            compose.onNodeWithTag("message-composer").assertIsDisplayed()
            fixture.screenshot("telegram-reaction-selected")
        }
    }

    @Test fun holdingAReactionOpensItsPeopleWithoutToggling() {
        fixture.launch("design").use {
            openChat()
            val chip = compose.onNodeWithText("❤️ 2")
            chip.performScrollTo().performClick()
            fixture.waitText("❤️ 3 ✓")
            val selectedChip = compose.onNodeWithText("❤️ 3 ✓")
            selectedChip.performTouchInput { longClick() }
            fixture.waitTag("reaction-people")
            compose.onNodeWithTag("reaction-filter-❤️").assertIsSelected()
            compose.onNodeWithTag("reaction-filter-all").performClick().assertIsSelected()
            compose.onNodeWithTag("reaction-filter-❤️").performClick().assertIsSelected()
            compose.onNodeWithTag("close-action-sheet").performClick()
            fixture.waitAbsent("reaction-people")
            selectedChip.assertIsDisplayed().assertIsFocused()
            compose.onAllNodesWithContentDescription(
                fixture.context.getString(R.string.reaction_people),
            ).assertCountEquals(0)
            selectedChip.performClick()
            fixture.waitText("❤️ 2")
            fixture.screenshot("telegram-reaction-hold-people")
        }
    }

    @Test fun settingsAndShareReturnThroughOneInformationSheet() {
        fixture.launch("design").use {
            openChat()
            compose.onNodeWithTag("meeting-header-subtitle", useUnmergedTree = true)
                .assertTextContains("Суббота, 31 октября · 6 участников")
            val heading = compose.onNodeWithTag("meeting-heading")
            heading.assertHeightIsAtLeast(DesignTokens.targetAndroid).performClick()
            fixture.waitTag("meeting-information")
            compose.onNodeWithTag("close-action-sheet").performClick()
            fixture.waitAbsent("chat-action-sheet")
            heading.assertIsFocused()
            compose.onNodeWithTag("message-composer").performTextReplacement("Черновик в чате")
            compose.onNodeWithContentDescription(
                fixture.context.getString(R.string.meeting_information),
            )
                .performClick()
            fixture.waitTag("meeting-information")
            compose.onNodeWithTag("open-settings").performScrollTo().performClick()
            fixture.waitTag("meeting-settings")
            compose.onAllNodes(hasTestTag("chat-action-sheet")).assertCountEquals(1)
            compose.onNodeWithTag("settings-save").assertIsDisplayed()
            assertSettingsFieldOrder()
            compose.onNodeWithTag("cover-select").performScrollTo().assertIsDisplayed()
            compose.onNodeWithTag("settings-save").assertIsDisplayed()
            compose.onNodeWithTag("close-action-sheet").performClick()
            fixture.waitTag("meeting-information")
            compose.onNodeWithTag("information-share").performScrollTo().performClick()
            fixture.waitText(fixture.context.getString(R.string.invitation_copy_link))
            compose.onAllNodes(hasTestTag("chat-action-sheet")).assertCountEquals(1)
            compose.onNodeWithTag("close-action-sheet").performClick()
            fixture.waitTag("open-settings")
            compose.onNodeWithTag("close-action-sheet").performClick()
            fixture.waitAbsent("chat-action-sheet")
            compose.onNodeWithTag("message-composer").assertTextContains("Черновик в чате")
            compose.onNodeWithTag("meeting-information-open").assertIsFocused()
            fixture.screenshot("telegram-sheet-return")
        }
    }

    private fun assertSettingsFieldOrder() {
        val fieldPositions = listOf(
            R.string.meeting_title_field,
            R.string.meeting_description_field,
            R.string.meeting_day_field,
            R.string.meeting_place_field,
        ).map { label ->
            compose.onNodeWithContentDescription(fixture.context.getString(label))
                .fetchSemanticsNode().positionInRoot.y
        } + compose.onNodeWithText(fixture.context.getString(R.string.cover_title))
            .fetchSemanticsNode().positionInRoot.y
        assertTrue(
            "Settings must show title, description, date, place and cover in that order",
            fieldPositions.zipWithNext().all { (before, after) -> before < after },
        )
    }

    private fun openChat() {
        fixture.waitText("Настолки у Саши")
        compose.onNodeWithText("Настолки у Саши").performScrollTo().performClick()
        fixture.waitTag("message-composer")
    }
}
