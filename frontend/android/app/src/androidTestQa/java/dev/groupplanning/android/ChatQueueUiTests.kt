package dev.groupplanning.android

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performTextInput
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
import dev.groupplanning.android.ui.feed.MessageComposer
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.SomewhereTheme
import java.util.UUID
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class ChatQueueUiTests {
    @get:Rule val compose = createComposeRule()
    private val actor = UserProfile(UUID.randomUUID(), "Тест")
    private val intent =
        PendingMessage(UUID.randomUUID(), "Исходящее", ApiInstant("2026-10-27T12:00:00Z"))

    @Test fun acknowledgedMessageKeepsSameComposeSemanticsNode() {
        val feed = mutableStateOf(FeedState(ready = true))
        val messages = mutableStateOf(MessageState(queue = listOf(intent), ready = true))
        compose.setContent {
            SomewhereTheme {
                CompositionLocalProvider(LocalChatPresentation provides ChatPresentation()) {
                    Box(Modifier.fillMaxSize()) {
                        FeedTimeline(feed.value, messages.value, actor, {}, {}, {}, {})
                    }
                }
            }
        }
        val before = compose.onNodeWithTag("message-pending").fetchSemanticsNode().id
        compose.runOnIdle {
            feed.value = feed.value.copy(
                entries = listOf(
                    FeedEntry(
                        UUID.randomUUID(),
                        UUID.randomUUID(),
                        ServerCounter("102"),
                        "message",
                        1,
                        actor, intent.createdAt,
                        buildJsonObject {
                            put("text", intent.text)
                        },
                        intent.key,
                    ),
                ),
            )
            messages.value = messages.value.copy(queue = emptyList())
        }
        val after = compose.onNodeWithTag("feed-entry-102").fetchSemanticsNode().id
        assertEquals(before, after)
        compose.onNodeWithTag("message-pending").assertDoesNotExist()
    }

    @Test fun composerAcceptsNewTextWhileEarlierMessageIsSending() {
        val messages = mutableStateOf(
            MessageState(
                queue = listOf(intent.copy(status = DeliveryStatus.Sending)),
                ready = true,
            ),
        )
        compose.setContent {
            SomewhereTheme {
                CompositionLocalProvider(LocalChatPresentation provides ChatPresentation()) {
                    MessageComposer(
                        messages.value,
                        {
                            messages.value =
                                messages.value.copy(draft = it)
                        },
                        {},
                        {},
                        {},
                        {},
                        DesignTokens.componentEmojiDockPreferredHeight,
                    )
                }
            }
        }
        compose.onNodeWithTag("message-composer").assertIsEnabled().performTextInput("Следующее")
        compose.runOnIdle { assertEquals("Следующее", messages.value.draft) }
        compose.onNodeWithTag("message-send").assertIsEnabled()
    }
}
