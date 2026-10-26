package dev.groupplanning.android

import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.text.TextLayoutResult
import java.time.LocalDate
import org.junit.Assert.assertFalse
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class SavedInvitationsUiTests {
    @get:Rule val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)
    private val card = "saved-invitation-22222222-2222-4222-8222-222222222222"

    @Before fun configure() {
        fixture.configure()
    }

    @Test fun confirmedResponsesMoveInvitationAndFailedSaveKeepsAnswer() {
        fixture.launch("saved-invitations").use {
            fixture.waitTag("home-invitations")
            compose.onNodeWithTag("home-invitations").performClick()
            fixture.waitTag(card)
            fixture.screenshot("android-saved-invitations")
            compose.onNodeWithTag(card).performClick()
            fixture.waitText("Вы пока не уверены")
            respond("Приду")
            fixture.waitText("Повторить сохранение")
            compose.onNodeWithText("Вы пока не уверены").assertIsDisplayed()
            compose.onAllNodesWithTag("invitation-conversation").assertCountEquals(0)
            fixture.screenshot("android-saved-response-error")
            compose.onNodeWithTag("rsvp-save").performScrollTo().performClick()
            fixture.waitTag("invitation-conversation")
            fixture.device.pressBack()
            fixture.waitText("Пока нет приглашений")
            compose.onNodeWithTag("home-meetings").performClick()
            fixture.waitText("Настолки у Саши")
            compose.onNodeWithText("Настолки у Саши").performClick()
            fixture.waitTag("invitation-conversation")
            compose.onNodeWithContentDescription("Информация о встрече").performClick()
            fixture.waitTag("invitation-people")
            respond("Возможно")
            fixture.waitText("Вы пока не уверены")
            compose.onAllNodesWithTag("invitation-conversation").assertCountEquals(0)
            fixture.device.pressBack()
            fixture.waitTag("home-invitations")
            compose.onNodeWithTag("home-invitations").performClick()
            fixture.waitTag(card)
            compose.onNodeWithTag(card).performClick()
            fixture.waitText("Вы пока не уверены")
            respond("Не смогу")
            fixture.waitText("Вы не сможете прийти")
            fixture.device.pressBack()
            fixture.waitText("Пока нет приглашений")
            fixture.screenshot("android-saved-empty")
        }
    }

    @Test fun listErrorRetryLargeTextAndBack() {
        val original = fixture.shell("settings get system font_scale").trim()
        try {
            fixture.shell("settings put system font_scale 1.8")
            fixture.launch("saved-error").use {
                fixture.waitTag("home-invitations")
                compose.onNodeWithTag("home-invitations").performClick()
                fixture.waitText("Не удалось загрузить приглашения")
                fixture.screenshot("android-saved-list-error")
                compose.onNodeWithText("Повторить").performScrollTo().performClick()
                fixture.waitTag(card)
                compose.onNodeWithTag(card).assertIsDisplayed()
                val layouts = mutableListOf<TextLayoutResult>()
                compose.onNodeWithTag("invitations-heading").performSemanticsAction(
                    SemanticsActions.GetTextLayoutResult,
                ) { it(layouts) }
                assertFalse(layouts.single().hasVisualOverflow)
                fixture.screenshot("android-saved-large-text")
                compose.onNodeWithTag(card).performClick()
                fixture.waitText("Вы пока не уверены")
                fixture.device.pressBack()
                fixture.waitTag(card)
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

    @Test fun emptyInvitationsPreserveCalendarDayAndSelectedTabAfterRecreation() {
        fixture.launch("saved-empty").use { activity ->
            fixture.waitText("С чего начнём?")
            compose.onNodeWithText("Календарь").performClick()
            val day = "day-${LocalDate.now().withDayOfMonth(15)}"
            fixture.waitTag(day)
            compose.onNodeWithTag(day).performClick()
            compose.onNodeWithTag("home-invitations").performClick()
            fixture.waitText("Пока нет приглашений")
            compose.onAllNodesWithContentDescription("Создать встречу").assertCountEquals(0)
            activity.recreate()
            fixture.waitText("Пока нет приглашений")
            compose.onNodeWithTag("home-invitations").assertIsSelected()
            compose.onNodeWithTag("home-meetings").performClick()
            fixture.waitTag(day)
            compose.onNodeWithTag(day).assertIsSelected()
        }
    }

    private fun respond(answer: String) {
        compose.onNode(hasText(answer) and hasClickAction()).performScrollTo().performClick()
        compose.onNodeWithTag("rsvp-save").performScrollTo().performClick()
    }
}
