package dev.groupplanning.android

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import dev.groupplanning.android.data.api.models.ApiInstant
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.data.api.models.ServerCounter
import dev.groupplanning.android.data.api.models.UserProfile
import dev.groupplanning.android.data.outbox.DeliveryStatus
import dev.groupplanning.android.data.outbox.PendingMessage
import dev.groupplanning.android.state.feed.FeedState
import dev.groupplanning.android.state.feed.MessageState
import dev.groupplanning.android.ui.feed.ChatPresentation
import dev.groupplanning.android.ui.feed.FeedTimeline
import dev.groupplanning.android.ui.feed.LocalChatPresentation
import dev.groupplanning.android.ui.theme.SomewhereTheme
import java.time.Instant
import java.util.UUID
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class ChatPendingIndicatorUiTests {
    @get:Rule val compose = createComposeRule()
    private val actor = UserProfile(UUID.randomUUID(), "Автор")
    private val feed = mutableStateOf(FeedState(ready = true))
    private lateinit var pending: PendingMessage
    private lateinit var messages: MutableState<MessageState>

    @Test fun slowAckShowsDelayedSpinnerWithoutResettingAtSendingOrMovingTheRow() {
        start()
        val before = compose.onNodeWithTag("message-pending").fetchSemanticsNode()
        val beforeBounds = before.boundsInWindow
        val slot = compose.onNodeWithTag("message-delivery-slot")
            .fetchSemanticsNode().boundsInWindow
        compose.onNodeWithTag("message-pending-indicator").assertDoesNotExist()
        compose.mainClock.advanceTimeBy(1000)
        compose.runOnIdle {
            messages.value =
                messages.value.copy(queue = listOf(pending.copy(status = DeliveryStatus.Sending)))
        }
        compose.mainClock.advanceTimeBy(1200)
        compose.onNodeWithTag("message-pending-indicator").assertIsDisplayed()
        compose.onNodeWithText("Отправляем…").assertDoesNotExist()
        assertEquals(
            beforeBounds,
            compose.onNodeWithTag("message-pending")
                .fetchSemanticsNode().boundsInWindow,
        )
        acknowledge()
        val after = compose.onNodeWithTag("feed-entry-102").fetchSemanticsNode()
        assertEquals(before.id, after.id)
        assertEquals(beforeBounds, after.boundsInWindow)
        assertEquals(
            slot,
            compose.onNodeWithTag("message-delivery-slot")
                .fetchSemanticsNode().boundsInWindow,
        )
        compose.onNodeWithTag("message-pending-indicator").assertDoesNotExist()
    }

    @Test fun fastAckNeverShowsAnIndicatorAndCancelsItsTimer() {
        start()
        val before = compose.onNodeWithTag("message-pending").fetchSemanticsNode()
        val beforeBounds = before.boundsInWindow
        compose.mainClock.advanceTimeBy(100)
        compose.onNodeWithTag("message-pending-indicator").assertDoesNotExist()
        acknowledge()
        compose.mainClock.advanceTimeBy(3000)
        compose.onNodeWithTag("message-pending-indicator").assertDoesNotExist()
        assertEquals(before.id, compose.onNodeWithTag("feed-entry-102").fetchSemanticsNode().id)
        assertEquals(
            beforeBounds,
            compose.onNodeWithTag("feed-entry-102")
                .fetchSemanticsNode().boundsInWindow,
        )
    }

    private fun start() {
        compose.mainClock.autoAdvance = false
        pending =
            PendingMessage(UUID.randomUUID(), "Исходящее", ApiInstant(Instant.now().toString()))
        messages = mutableStateOf(MessageState(queue = listOf(pending), ready = true))
        compose.setContent {
            SomewhereTheme {
                CompositionLocalProvider(LocalChatPresentation provides ChatPresentation()) {
                    Box(Modifier.fillMaxSize()) {
                        FeedTimeline(feed.value, messages.value, actor, {}, {}, {}, {})
                    }
                }
            }
        }
        compose.mainClock.advanceTimeBy(100)
        compose.waitForIdle()
    }

    private fun acknowledge() {
        compose.runOnIdle {
            feed.value = feed.value.copy(
                entries = listOf(
                    FeedEntry(
                        UUID.randomUUID(), UUID.randomUUID(), ServerCounter("102"), "message", 1,
                        actor, pending.createdAt,
                        buildJsonObject {
                            put("text", pending.text)
                        },
                        pending.key,
                    ),
                ),
            )
            messages.value = messages.value.copy(queue = emptyList())
        }
        compose.mainClock.advanceTimeByFrame()
        compose.waitForIdle()
    }
}
