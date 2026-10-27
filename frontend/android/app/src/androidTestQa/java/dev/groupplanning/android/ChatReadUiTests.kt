package dev.groupplanning.android

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.layout.boundsInWindow
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.data.api.models.ApiInstant
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.data.api.models.ServerCounter
import dev.groupplanning.android.data.api.models.UserProfile
import dev.groupplanning.android.data.repository.ChatViewport
import dev.groupplanning.android.state.feed.FeedState
import dev.groupplanning.android.state.feed.MessageState
import dev.groupplanning.android.ui.feed.ChatPresentation
import dev.groupplanning.android.ui.feed.FeedTimeline
import dev.groupplanning.android.ui.feed.LocalChatPresentation
import dev.groupplanning.android.ui.theme.SomewhereTheme
import java.util.UUID
import kotlin.math.abs
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class ChatReadUiTests {
    @get:Rule val compose = createComposeRule()
    private val user = UserProfile(UUID.randomUUID(), "Автор")
    private val meeting = UUID.randomUUID()
    private fun entry(sequence: Int, text: String = "Сообщение $sequence") = FeedEntry(
        UUID.nameUUIDFromBytes(sequence.toString().toByteArray()), meeting,
        ServerCounter(sequence.toString()), "message", 1, user,
        ApiInstant("2026-10-28T00:00:00Z"), buildJsonObject { put("text", text) }, null,
    )

    @Test fun savedTopAnchorSurvivesPrependNewTailResizeAndReentry() {
        val anchor = entry(125)
        val feed = mutableStateOf(
            FeedState(
                entries = (101..150).map { entry(it) },
                ready = true,
                viewport = ChatViewport(anchor.id, 0f, false),
                anchor = anchor.id,
            ),
        )
        val height = mutableStateOf(600.dp)
        val shown = mutableStateOf(true)
        var saved: ChatViewport? = null
        compose.setContent {
            SomewhereTheme {
                CompositionLocalProvider(LocalChatPresentation provides ChatPresentation()) {
                    if (shown.value) {
                        Box(Modifier.fillMaxWidth().height(height.value)) {
                            FeedTimeline(
                                feed.value,
                                MessageState(ready = true),
                                user,
                                {},
                                {},
                                {},
                                {},
                                viewport = { saved = it },
                            )
                        }
                    }
                }
            }
        }
        compose.waitForIdle()
        val initial = compose.onNodeWithTag("feed-entry-125").fetchSemanticsNode().boundsInRoot.top
        val tolerance = 2 * compose.density.density
        compose.runOnIdle {
            feed.value =
                feed.value.copy(entries = listOf(entry(100)) + feed.value.entries + entry(151))
        }
        compose.waitForIdle()
        var top = compose.onNodeWithTag("feed-entry-125").fetchSemanticsNode().boundsInRoot.top
        assertTrue("prepend/new tail drift ${top - initial}", abs(top - initial) <= tolerance)
        compose.runOnIdle {
            feed.value = feed.value.copy(
                entries = feed.value.entries.map {
                    if (it.id ==
                        anchor.id
                    ) {
                        entry(125, (1..5).joinToString("\n") { "Поздняя высота $it" })
                    } else {
                        it
                    }
                },
            )
        }
        compose.waitForIdle()
        top = compose.onNodeWithTag("feed-entry-125").fetchSemanticsNode().boundsInRoot.top
        assertTrue("late height drift ${top - initial}", abs(top - initial) <= tolerance)
        compose.runOnIdle { height.value = 420.dp }
        compose.waitForIdle()
        top = compose.onNodeWithTag("feed-entry-125").fetchSemanticsNode().boundsInRoot.top
        assertTrue("IME-sized resize drift ${top - initial}", abs(top - initial) <= tolerance)
        assertNotNull(saved?.entry)
        compose.runOnIdle { shown.value = false }
        compose.waitForIdle()
        compose.runOnIdle {
            feed.value = feed.value.copy(viewport = saved)
            shown.value = true
        }
        compose.waitForIdle()
        top = compose.onNodeWithTag("feed-entry-125").fetchSemanticsNode().boundsInRoot.top
        assertTrue("reentry drift ${top - initial}", abs(top - initial) <= tolerance)
    }

    @Test fun topOfOversizedBubbleDoesNotReportVisibleEnd() {
        val long = entry(100, (1..80).joinToString("\n") { "Длинная строка $it" })
        val bounds = mutableStateOf(Rect.Zero)
        var endings = emptyList<UUID>()
        compose.setContent {
            SomewhereTheme {
                CompositionLocalProvider(LocalChatPresentation provides ChatPresentation()) {
                    Box(
                        Modifier.fillMaxWidth().height(500.dp).onGloballyPositioned {
                            bounds.value = it.boundsInWindow()
                        },
                    ) {
                        FeedTimeline(
                            FeedState(
                                entries = listOf(long, entry(101)),
                                ready = true,
                                viewport = ChatViewport(long.id, 0f, false),
                            ),
                            MessageState(ready = true), user, {}, {}, {}, {},
                            readVisible = { _, ends, eligible ->
                                endings =
                                    if (eligible) ends.map { it.id } else emptyList()
                            },
                            readEligible = true, bounds = bounds.value,
                        )
                    }
                }
            }
        }
        compose.waitForIdle()
        assertFalse(endings.contains(long.id))
        compose.onNodeWithTag("feed-end").performClick()
        compose.waitForIdle()
        assertTrue(endings.contains(entry(101).id))
    }
}
