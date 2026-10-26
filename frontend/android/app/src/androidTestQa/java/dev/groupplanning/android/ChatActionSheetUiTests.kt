package dev.groupplanning.android

import android.animation.ValueAnimator
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextReplacement
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.swipeDown
import androidx.test.uiautomator.By
import androidx.test.uiautomator.Until
import org.junit.After
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class ChatActionSheetUiTests {
    @get:Rule val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)
    private val environment = ChatSheetEnvironment(fixture)

    @Before fun configure() {
        fixture.configure()
        environment.prepare()
    }

    @After fun restoreSettings() = environment.restore()

    @Test fun reducedMotionKeepsAllCreationSheetsAndTheirReturnToChatUsable() {
        environment.disableMotion()
        fixture.launch("design").use {
            openChat()
            compose.waitUntil(10_000) { !ValueAnimator.areAnimatorsEnabled() }
            listOf(
                Triple("new-date-poll", R.string.action_date_title, "poll-create"),
                Triple("new-place-poll", R.string.place_poll_title, "place-poll-create"),
                Triple("new-preparation-task", R.string.preparation_propose, "preparation-create"),
            ).forEach { (action, heading, submit) ->
                openAction(action)
                compose.onNode(
                    hasText(fixture.context.getString(heading)) and
                        SemanticsMatcher.keyIsDefined(SemanticsProperties.Heading),
                ).assertIsDisplayed()
                compose.onNodeWithTag("close-action-sheet").assertIsDisplayed()
                compose.onNodeWithTag(submit).performScrollTo().assertIsDisplayed()
                fixture.screenshot("sheet-reduced-motion-$action")
                compose.onNodeWithTag("close-action-sheet").performClick()
                fixture.waitAbsent("chat-action-sheet")
                compose.onNodeWithTag("message-composer").assertIsDisplayed()
            }
        }
    }

    @Test fun allCreationSheetsKeepTheirHeadingCloseAndSubmitAtLargeText() {
        fixture.shell("settings put system font_scale 1.8")
        fixture.launch("design").use {
            openChat()
            compose.waitUntil(10_000) {
                kotlin.math.abs(fixture.context.resources.configuration.fontScale - 1.8f) < .01f
            }
            listOf(
                Triple("new-date-poll", R.string.action_date_title, "poll-create"),
                Triple("new-place-poll", R.string.place_poll_title, "place-poll-create"),
                Triple("new-preparation-task", R.string.preparation_propose, "preparation-create"),
            ).forEach { (action, heading, submit) ->
                openAction(action)
                compose.onNode(
                    hasText(fixture.context.getString(heading)) and
                        SemanticsMatcher.keyIsDefined(SemanticsProperties.Heading),
                ).assertIsDisplayed()
                compose.onNodeWithTag("close-action-sheet").assertIsDisplayed()
                compose.onNodeWithTag(submit).performScrollTo().assertIsDisplayed()
                fixture.screenshot("sheet-large-$action")
                fixture.device.pressBack()
                fixture.waitAbsent("chat-action-sheet")
                compose.onNodeWithTag("message-composer").assertIsDisplayed()
            }
        }
    }

    @Test fun softwareKeyboardAndCloseKeepPlaceAndTaskDrafts() {
        fixture.launch("design").use {
            openChat()
            listOf(
                "new-place-poll" to listOf(
                    "place-poll-place" to "Кафе у парка",
                    "place-poll-explanation" to "Тихий зал для всех",
                ),
                "new-preparation-task" to listOf("preparation-title" to "Заказать пиццу"),
            ).forEach { (action, fields) ->
                openAction(action)
                fields.forEach { (field, value) ->
                    compose.onNodeWithTag(field).performScrollTo().performClick()
                        .performTextReplacement(value)
                    compose.waitUntil(10_000) { environment.keyboardBounds() != null }
                    compose.onNodeWithTag(field).performScrollTo()
                    fixture.screenshot("sheet-ime-$field")
                    compose.waitUntil(10_000) {
                        val keyboard = environment.keyboardBounds() ?: return@waitUntil false
                        val fieldBounds = compose.onNodeWithTag(field)
                            .fetchSemanticsNode().boundsInWindow
                        val closeBounds = compose.onNodeWithTag("close-action-sheet")
                            .fetchSemanticsNode().boundsInWindow
                        fieldBounds.bottom <= keyboard.top && closeBounds.bottom <= keyboard.top
                    }
                    compose.onNodeWithTag("close-action-sheet").assertIsDisplayed()
                }
                compose.onNodeWithTag("close-action-sheet").performClick()
                fixture.waitAbsent("chat-action-sheet")
                compose.waitUntil(10_000) { environment.keyboardBounds() == null }
                compose.onNodeWithTag("message-composer").assertIsDisplayed()
                openAction(action)
                fields.forEach { (field, value) ->
                    compose.onNodeWithTag(field).performScrollTo().assertTextContains(value)
                }
                fixture.screenshot("sheet-restored-$action")
                fixture.device.pressBack()
                fixture.waitAbsent("chat-action-sheet")
            }
        }
    }

    @Test fun downwardDismissKeepsDraftAndMeetingInformationHasNoServiceLinks() {
        fixture.launch("design").use {
            openChat()
            openAction("new-preparation-task")
            compose.onNodeWithTag("preparation-title").performClick()
                .performTextReplacement("Принести игру")
            compose.waitUntil(10_000) { environment.keyboardBounds() != null }
            fixture.device.pressBack()
            compose.waitUntil(10_000) { environment.keyboardBounds() == null }
            compose.onNodeWithTag("chat-action-sheet").performTouchInput {
                swipeDown(startY = 1f, endY = height.toFloat() - 1f)
            }
            fixture.waitAbsent("chat-action-sheet")
            compose.onNodeWithTag("message-composer").assertIsDisplayed()
            openAction("new-preparation-task")
            compose.onNodeWithTag("preparation-title").assertTextContains("Принести игру")
            fixture.screenshot("sheet-swipe-restored")
            compose.onNodeWithTag("close-action-sheet").performClick()
            fixture.waitAbsent("chat-action-sheet")
            compose.onNodeWithContentDescription(
                fixture.context.getString(R.string.meeting_information),
            )
                .performClick()
            fixture.waitTag("invitation-people")
            compose.onNode(
                hasText("Настолки у Саши") and
                    SemanticsMatcher.keyIsDefined(SemanticsProperties.Heading),
            ).assertIsDisplayed()
            compose.onNodeWithTag("close-action-sheet").assertIsDisplayed()
            compose.onAllNodes(hasTestTag("chat-action-sheet")).assertCountEquals(1)
            listOf(
                R.string.support_title,
                R.string.help_title,
                R.string.about_title,
                R.string.privacy_title,
                R.string.cookies_title,
                R.string.developer_credit,
            ).forEach { resource ->
                compose.onAllNodes(
                    hasText(fixture.context.getString(resource)),
                ).assertCountEquals(0)
            }
            compose.onNodeWithTag("open-settings").assertExists()
            compose.onNodeWithTag("information-share").performScrollTo().assertIsDisplayed()
            fixture.screenshot("sheet-meeting-information-no-service-links")
            compose.onNodeWithTag("information-share").performClick()
            assertTrue(
                fixture.device.wait(Until.hasObject(By.pkg("com.android.intentresolver")), 10_000),
            )
            fixture.device.pressBack()
            fixture.waitTag("meeting-information")
            compose.onAllNodes(hasTestTag("chat-action-sheet")).assertCountEquals(1)
            compose.onNodeWithTag("close-action-sheet").assertIsDisplayed()
            fixture.screenshot("sheet-meeting-information-share-return")
            compose.onNodeWithTag("close-action-sheet").performClick()
            fixture.waitAbsent("chat-action-sheet")
            fixture.waitTag("message-composer")
        }
    }

    private fun openChat() {
        fixture.waitText("Настолки у Саши")
        compose.onNodeWithText("Настолки у Саши").performScrollTo().performClick()
        fixture.waitTag("meeting-add")
    }

    private fun openAction(action: String) {
        compose.onNodeWithTag("meeting-add").performClick()
        compose.onNodeWithTag(action).performClick()
        fixture.waitTag("chat-action-sheet")
    }
}
