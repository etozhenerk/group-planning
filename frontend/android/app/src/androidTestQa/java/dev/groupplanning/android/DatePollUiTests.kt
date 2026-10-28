package dev.groupplanning.android

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollToNode
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class DatePollUiTests {
    @get:Rule val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Before fun configure() {
        fixture.configure()
    }

    @Test fun createVoteAndApplyDateWithoutTime() {
        fixture.launch("poll-owner", "UFBQUFBQUFBQUFBQUFBQUA").use {
            fixture.waitTag("meeting-add")
            compose.onNodeWithTag("meeting-add").performClick()
            compose.onNodeWithTag("new-date-poll").performClick()
            fixture.waitTag("poll-create")
            fixture.screenshot("poll-create")
            compose.onNodeWithTag("poll-create").assertIsDisplayed().performClick()
            fixture.waitTag("poll-error")
            fixture.screenshot("poll-create-uncertain")
            fixture.closeActionSheet()
            fixture.waitAbsent("chat-action-sheet")
            compose.onNodeWithTag("meeting-add").performClick()
            compose.onNodeWithTag("new-date-poll").performClick()
            fixture.waitTag("poll-error")
            fixture.screenshot("poll-create-restored")
            compose.onNodeWithTag("poll-create").assertIsDisplayed().performClick()
            fixture.waitAbsent("chat-action-sheet")
            fixture.waitTag("poll-option-2026-10-26")
            compose.onNodeWithTag(
                "feed-timeline",
            ).performScrollToNode(hasTestTag("poll-option-2026-10-26"))
            compose.onNodeWithTag("poll-option-2026-10-26").performClick()
            compose.onNodeWithText("Проголосовать").performClick()
            fixture.waitText("Опрос завершён · дата выбрана")
            compose.onNodeWithText("Проголосовать").assertDoesNotExist()
            fixture.screenshot("poll-applied")
            compose.onNodeWithContentDescription("Информация о встрече").performClick()
            fixture.waitText("26 октября 2026 · Время пока не выбрано")
            compose.onNodeWithText("26 октября 2026 · Время пока не выбрано").assertIsDisplayed()
            fixture.screenshot("poll-date-only-details")
        }
    }

    @Test fun organizerResolvesTie() {
        fixture.launch("poll-tie").use {
            open("200")
            fixture.waitText("Выбор за организатором")
            fixture.screenshot("poll-tie")
            compose.onNodeWithTag("poll-resolve-2026-10-26").performClick()
            fixture.waitText("Опрос завершён · дата выбрана")
        }
    }

    @Test fun dstResolutionCanLeaveTimeUnspecified() {
        fixture.launch("poll-time").use {
            open("300")
            fixture.waitText("Оставить без времени")
            fixture.screenshot("poll-time-required")
            compose.onNodeWithText("Оставить без времени").performClick()
            fixture.waitText("Опрос завершён · дата выбрана")
            compose.onNodeWithContentDescription("Информация о встрече").performClick()
            fixture.waitText("8 марта 2026 · Время пока не выбрано")
        }
    }

    @Test fun cancelledHiddenPollHasNoTotalsOrActions() {
        fixture.launch("poll-hidden").use {
            open("400")
            fixture.waitText("Опрос завершён")
            compose.onNodeWithTag("poll-option-2026-10-25")
                .assertTextContains("25 октября, воскресенье").assertIsNotEnabled()
            compose.onNodeWithText("1").assertDoesNotExist()
            compose.onNodeWithText("Проголосовать").assertDoesNotExist()
            compose.onNodeWithText("Добавить дату").assertDoesNotExist()
            compose.onNodeWithText("Результаты появятся после окончания").assertDoesNotExist()
            fixture.screenshot("poll-cancelled-hidden")
        }
    }

    private fun open(suffix: String) {
        val tag = "meeting-d3c50000-0000-4000-8000-000000000$suffix"
        fixture.waitTag(tag)
        compose.onNodeWithTag(tag).performClick()
        fixture.waitTag("meeting-add")
    }
}
