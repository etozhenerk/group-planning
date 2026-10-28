package dev.groupplanning.android

import androidx.compose.material3.Text
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.swipeDown
import dev.groupplanning.android.data.api.models.UserProfile
import dev.groupplanning.android.state.feed.ChatReadingState
import dev.groupplanning.android.ui.components.ActionSheet
import dev.groupplanning.android.ui.feed.ChatReadersSheet
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.SomewhereTheme
import java.util.UUID
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class SheetControlsUiTests {
    @get:Rule val compose = createComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Test fun readersLoadingEmptyErrorShortAndLongListKeepOneViewport() {
        val state = mutableStateOf(ChatReadingState(loading = true))
        compose.setContent {
            SomewhereTheme { ChatReadersSheet(state.value, {}, {}, {}) }
        }
        compose.onNodeWithTag("chat-readers").assertIsDisplayed()
        fixture.screenshot("readers-loading-fixed")
        val header = compose.onNodeWithTag("action-sheet-heading")
            .fetchSemanticsNode().boundsInWindow
        val body = compose.onNodeWithTag("action-sheet-content")
            .fetchSemanticsNode().boundsInWindow
        val people = List(7) { UserProfile(UUID.randomUUID(), "Участник ${it + 1}") }
        listOf(
            ChatReadingState(),
            ChatReadingState(error = true),
            ChatReadingState(readers = people.take(1)),
            ChatReadingState(readers = people, nextCursor = "more"),
        ).forEachIndexed { index, next ->
            compose.runOnIdle { state.value = next }
            compose.onNodeWithTag("close-action-sheet").assertDoesNotExist()
            assertEquals(
                header,
                compose.onNodeWithTag("action-sheet-heading")
                    .fetchSemanticsNode().boundsInWindow,
            )
            assertEquals(
                body,
                compose.onNodeWithTag("action-sheet-content")
                    .fetchSemanticsNode().boundsInWindow,
            )
            if (next.readers.size >= 3) {
                val rows = next.readers.take(3).map {
                    compose.onNodeWithTag("chat-reader-${it.id}")
                        .fetchSemanticsNode().boundsInWindow
                }
                val expectedGap = with(compose.density) { DesignTokens.spaceS12.toPx() }
                rows.zipWithNext().forEach { (previous, following) ->
                    assertEquals(expectedGap, following.top - previous.bottom, 1f)
                }
            }
            fixture.screenshot("readers-fixed-$index")
        }
        compose.onNodeWithText("Участник 7").performScrollTo().assertIsDisplayed()
        compose.onNodeWithTag("chat-readers-more").performScrollTo().assertIsDisplayed()
    }

    @Test fun handleAccessibilitySwipeBackAndBackdropDismissWithoutCloseIconOrRefresh() {
        val open = mutableStateOf(true)
        val busy = mutableStateOf(true)
        var dismissed = 0
        compose.setContent {
            SomewhereTheme {
                if (open.value) {
                    ActionSheet("Панель", {
                        dismissed++
                        open.value = false
                    }, canClose = !busy.value) {
                        Text(
                            "Сохранённое состояние\nВторая строка\nТретья строка\nЧетвёртая строка",
                        )
                    }
                }
            }
        }
        compose.onNodeWithTag("close-action-sheet").assertDoesNotExist()
        val dismiss = SemanticsMatcher.keyIsDefined(SemanticsActions.Dismiss)
        compose.onNode(dismiss).performSemanticsAction(SemanticsActions.Dismiss) { it() }
        compose.onNodeWithTag("chat-action-sheet").assertIsDisplayed()
        assertEquals(0, dismissed)
        compose.onNodeWithTag("action-sheet-content").performTouchInput {
            swipeDown(startY = 1f, endY = height.toFloat() - 1f)
        }
        compose.onNodeWithTag("chat-action-sheet").assertIsDisplayed()
        fixture.device.pressBack()
        compose.onNodeWithTag("chat-action-sheet").assertIsDisplayed()
        assertEquals(0, dismissed)
        compose.runOnIdle { busy.value = false }
        compose.onNode(dismiss).performSemanticsAction(SemanticsActions.Dismiss) { it() }
        fixture.waitAbsent("chat-action-sheet")
        assertEquals(1, dismissed)
        compose.runOnIdle { open.value = true }
        fixture.waitTag("chat-action-sheet")
        fixture.device.pressBack()
        fixture.waitAbsent("chat-action-sheet")
        assertEquals(2, dismissed)
        compose.runOnIdle { open.value = true }
        fixture.waitTag("chat-action-sheet")
        compose.onNodeWithTag("chat-action-sheet").performTouchInput {
            swipeDown(startY = 1f, endY = height.toFloat() - 1f)
        }
        fixture.waitAbsent("chat-action-sheet")
        assertEquals(3, dismissed)
        compose.runOnIdle { open.value = true }
        fixture.waitTag("chat-action-sheet")
        val top = compose.onNodeWithTag("chat-action-sheet").fetchSemanticsNode().boundsInWindow.top
        fixture.device.click(20, (top / 2).toInt())
        fixture.waitAbsent("chat-action-sheet")
        assertEquals(4, dismissed)
    }
}
