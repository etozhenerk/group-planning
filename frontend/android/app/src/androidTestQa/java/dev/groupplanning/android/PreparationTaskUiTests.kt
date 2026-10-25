package dev.groupplanning.android

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import org.junit.Before
import org.junit.Rule
import org.junit.Test

class PreparationTaskUiTests {
    @get:Rule val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Before fun configure() {
        fixture.configure()
    }

    private fun open(suffix: String) {
        val tag = "meeting-d3c70000-0000-4000-8000-000000000$suffix"
        fixture.waitTag(tag)
        compose.onNodeWithTag(tag).performClick()
        fixture.waitTag("meeting-add")
    }

    @Test fun proposalPreservesDraftAndRequiresRecipientsConsent() {
        fixture.launch("task-owner").use { scenario ->
            open("100")
            compose.onNodeWithTag("meeting-add").performClick()
            compose.onNodeWithTag("new-preparation-task").performClick()
            fixture.waitTag("preparation-title")
            compose.onNodeWithTag("preparation-title").performTextInput("Заказать пиццу")
            fixture.waitTag("preparation-recipient")
            compose.onNodeWithTag("preparation-recipient").performClick()
            compose.onNodeWithText("Лена").performClick()
            compose.onNodeWithTag("preparation-create").performScrollTo().performClick()
            fixture.waitTag("preparation-error")
            compose.onNodeWithTag("preparation-title").assertTextContains("Заказать пиццу")
            fixture.screenshot("android-task-create-error")
            scenario.recreate()
            fixture.waitTag("preparation-error")
            compose.onNodeWithTag("preparation-title").assertTextContains("Заказать пиццу")
            compose.onNodeWithTag("preparation-create").performScrollTo().performClick()
            fixture.waitText("Кому предложено: Лена")
            compose.onNodeWithTag("preparation-accept").assertDoesNotExist()
            fixture.screenshot("android-task-offered")
        }
    }

    @Test fun acceptanceRetryAndCompletion() {
        fixture.launch("task-recipient").use {
            open("200")
            fixture.waitText("Заказать пиццу")
            compose.onNodeWithText("Заказать пиццу").performClick()
            fixture.waitTag("preparation-accept")
            compose.onNodeWithTag("preparation-accept").performClick()
            fixture.waitText("Не удалось сохранить действие.")
            compose.onNodeWithTag("preparation-complete").assertDoesNotExist()
            fixture.screenshot("android-task-accept-error")
            compose.onNodeWithText("Повторить").performClick()
            fixture.waitTag("preparation-complete")
            compose.onNodeWithText("Задача у вас").assertIsDisplayed()
            fixture.screenshot("android-task-accepted")
            compose.onNodeWithTag("preparation-complete").performClick()
            fixture.waitText("Выполнено · Лена")
            compose.onNodeWithTag("preparation-complete").assertDoesNotExist()
            fixture.screenshot("android-task-completed")
        }
    }

    @Test fun refusalAndConcurrentAcceptanceRefresh() {
        fixture.launch("task-decline").use {
            open("300")
            fixture.waitText("Заказать пиццу")
            compose.onNodeWithText("Заказать пиццу").performClick()
            fixture.waitTag("preparation-decline")
            compose.onNodeWithTag("preparation-decline").performClick()
            fixture.waitText("Отказ · Лена")
            fixture.screenshot("android-task-declined")
        }
        fixture.launch("task-conflict").use {
            open("500")
            fixture.waitText("Заказать пиццу")
            compose.onNodeWithText("Заказать пиццу").performClick()
            fixture.waitTag("preparation-accept")
            compose.onNodeWithTag("preparation-accept").performClick()
            fixture.waitText("Исполняет Саша")
            compose.onNodeWithTag("preparation-accept").assertDoesNotExist()
            compose.onNodeWithTag("preparation-complete").assertDoesNotExist()
            fixture.screenshot("android-task-conflict")
        }
    }

    @Test fun cancellationAtLargeTextAndBack() {
        val original = fixture.shell("settings get system font_scale").trim()
        try {
            fixture.shell("settings put system font_scale 1.8")
            fixture.launch("task-cancel").use {
                open("400")
                fixture.waitText("Заказать пиццу")
                compose.onNodeWithText("Заказать пиццу").performClick()
                fixture.waitTag("preparation-cancel")
                compose.onNodeWithTag("preparation-cancel").performClick()
                fixture.waitText("Отменено · Саша")
                fixture.device.pressBack()
                fixture.screenshot("android-task-large-cancelled")
                fixture.device.pressBack()
                fixture.waitTag("meeting-d3c70000-0000-4000-8000-000000000400")
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
