package dev.groupplanning.android

import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollToNode
import androidx.compose.ui.test.performTextInput
import dev.groupplanning.android.qaCreateEmptyComposeRule as createEmptyComposeRule
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class PreparationTaskUiTests {
    @get:Rule(order = 0)
    val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule(order = 1)
    val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Before fun configure() {
        fixture.configure()
    }

    private fun open(suffix: String) {
        val tag = "meeting-d3c70000-0000-4000-8000-000000000$suffix"
        fixture.waitTag("meetings-list")
        compose.onNodeWithTag("meetings-list").performScrollToNode(hasTestTag(tag))
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
            compose.onNodeWithTag("preparation-create").assertIsDisplayed().performClick()
            waitSheetText(R.string.prep_unknown)
            compose.onNodeWithTag("preparation-title").assertTextContains("Заказать пиццу")
            fixture.screenshot("android-task-create-error")
            scenario.recreate()
            waitSheetText(R.string.prep_unknown)
            compose.onNodeWithTag("preparation-title").assertTextContains("Заказать пиццу")
            fixture.closeActionSheet()
            // Unknown submission keeps the same visible form until its original request is retried.
            compose.onNodeWithTag("chat-action-sheet").assertExists()
            waitSheetText(R.string.prep_unknown)
            compose.onNodeWithTag("preparation-title").assertTextContains("Заказать пиццу")
            compose.onNodeWithTag("preparation-create").assertIsDisplayed().performClick()
            fixture.waitAbsent("chat-action-sheet")
            fixture.waitText("Заказать пиццу")
            compose.onAllNodes(hasText("Заказать пиццу")).assertCountEquals(1)
            compose.onNodeWithText("Заказать пиццу").performClick()
            waitSheetText(R.string.prep_recipient)
            waitSheetText(R.string.prep_state_offered)
            compose.onNodeWithText("Лена").assertIsDisplayed()
            compose.onNodeWithTag("preparation-accept").assertDoesNotExist()
            fixture.screenshot("android-task-offered")
        }
    }

    @Test fun acceptanceRetryAndCompletion() {
        fixture.launch("task-recipient").use {
            open("200")
            fixture.waitText("Заказать пиццу")
            val inline = compose.onNodeWithTag("preparation-inline-accept")
            inline.assertIsDisplayed().assertTextContains("Взять на себя")
            assertTrue(
                "The inline task action must remain compact",
                inline.fetchSemanticsNode().boundsInRoot.width <
                    compose.onNodeWithText(
                        "Заказать пиццу",
                    ).fetchSemanticsNode().boundsInRoot.width,
            )
            compose.onNodeWithText("Заказать пиццу").performClick()
            fixture.waitTag("preparation-accept")
            compose.onNodeWithTag("preparation-accept").performClick()
            fixture.waitText("Не удалось сохранить действие.")
            compose.onNodeWithTag("preparation-complete").assertDoesNotExist()
            fixture.screenshot("android-task-accept-error")
            compose.onNodeWithText("Повторить").performClick()
            fixture.waitTag("preparation-complete")
            waitSheetText(R.string.prep_state_accepted)
            waitSheetText(R.string.prep_assignee)
            waitSheetText(fixture.context.getString(R.string.prep_you_suffix, "Лена"))
            fixture.screenshot("android-task-accepted")
            compose.onNodeWithTag("preparation-complete").performClick()
            waitSheetText(R.string.prep_state_completed)
            compose.onNodeWithTag("preparation-complete").assertDoesNotExist()
            fixture.screenshot("android-task-completed")
            fixture.closeActionSheet()
            fixture.waitAbsent("chat-action-sheet")
            fixture.waitText("Выполнено · Лена")
        }
    }

    @Test fun refusalAndConcurrentAcceptanceRefresh() {
        fixture.launch("task-decline").use {
            open("300")
            fixture.waitText("Заказать пиццу")
            compose.onNodeWithText("Заказать пиццу").performClick()
            fixture.waitTag("preparation-decline")
            compose.onNodeWithTag("preparation-decline").performClick()
            fixture.waitTag("preparation-confirm")
            compose.onNodeWithTag("preparation-confirm").performClick()
            waitSheetText(R.string.prep_state_declined)
            fixture.screenshot("android-task-declined")
            fixture.closeActionSheet()
            fixture.waitAbsent("chat-action-sheet")
            fixture.waitText("Отказ · Лена")
        }
        fixture.launch("task-conflict").use {
            open("500")
            fixture.waitText("Заказать пиццу")
            compose.onNodeWithText("Заказать пиццу").performClick()
            fixture.waitTag("preparation-accept")
            compose.onNodeWithTag("preparation-accept").performClick()
            waitSheetText(R.string.prep_state_accepted)
            waitSheetText(R.string.prep_assignee)
            val assigneeY = compose.onNodeWithText(
                fixture.context.getString(R.string.prep_assignee),
            ).fetchSemanticsNode().boundsInRoot.center.y
            compose.onNode(
                hasText("Саша") and SemanticsMatcher("Assignee value beside its fact label") {
                    kotlin.math.abs(it.boundsInRoot.center.y - assigneeY) <=
                        4 * compose.density.density
                },
            ).assertIsDisplayed()
            compose.onNodeWithTag("preparation-accept").assertDoesNotExist()
            compose.onNodeWithTag("preparation-complete").assertDoesNotExist()
            fixture.screenshot("android-task-conflict")
            fixture.closeActionSheet()
            fixture.waitAbsent("chat-action-sheet")
            fixture.waitText("Исполняет: Саша")
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
                fixture.waitTag("preparation-confirm")
                compose.onNodeWithTag("preparation-confirm").performClick()
                waitSheetText(R.string.prep_state_cancelled)
                fixture.device.pressBack()
                fixture.waitAbsent("chat-action-sheet")
                fixture.waitText("Отменено · Саша")
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
    private fun waitSheetText(resource: Int) = waitSheetText(fixture.context.getString(resource))

    private fun waitSheetText(text: String) {
        val target = hasText(text) and hasAnyAncestor(hasTestTag("chat-action-sheet"))
        compose.waitUntil(15_000) { compose.onAllNodes(target).fetchSemanticsNodes().isNotEmpty() }
        compose.onNode(target).assertIsDisplayed()
    }
}
