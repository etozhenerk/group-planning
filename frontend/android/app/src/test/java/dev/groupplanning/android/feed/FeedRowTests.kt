package dev.groupplanning.android.feed

import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.MeetingMedia
import dev.groupplanning.android.data.outbox.PendingMessage
import dev.groupplanning.android.state.feed.FeedState
import dev.groupplanning.android.state.feed.MessageState
import dev.groupplanning.android.state.feed.feedRows
import dev.groupplanning.android.support.Fixtures
import java.util.UUID
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class FeedRowTests {
    @Test fun everyIntentHasStableKeyAcrossAckAndQueueDoesNotShareOneRow() {
        val h = FeedHarness(StandardTestDispatcher())
        val first = PendingMessage(UUID.randomUUID(), "Первое", Fixtures.expiry)
        val second = PendingMessage(UUID.randomUUID(), "Второе", Fixtures.expiry)
        val messages = MessageState(queue = listOf(first, second), ready = true)
        val before = feedRows(FeedState(), messages, Fixtures.user)
        val accepted = h.entry(102, first.key, first.text)
        val after =
            feedRows(FeedState(entries = listOf(h.entry(101), accepted)), messages, Fixtures.user)
        assertEquals(2, before.size)
        assertEquals(before[0].key, after[1].key)
        assertEquals(before[1].key, after[2].key)
        assertEquals(3, after.map { it.key }.toSet().size)
    }

    @Test fun attachmentsWithSameRequestIdDoNotHideTextOnlyIntent() {
        val h = FeedHarness(StandardTestDispatcher())
        val intent = PendingMessage(UUID.randomUUID(), "Текст", Fixtures.expiry)
        val entry = h.entry(1, intent.key, intent.text)
        val media = MeetingMedia(
            UUID.randomUUID(), h.id, "test.txt", "text/plain", 1,
            "file", "message", "ready", createdAt = Fixtures.expiry, uploadedBy = Fixtures.user,
        )
        val rows = feedRows(
            FeedState(
                entries = listOf(
                    entry.copy(
                        payload = JsonObject(
                            entry.payload + (
                                "attachments" to JsonArray(
                                    listOf(
                                        apiJson.encodeToJsonElement(
                                            MeetingMedia.serializer(),
                                            media,
                                        ),
                                    ),
                                )
                                ),
                        ),
                    ),
                ),
            ),
            MessageState(queue = listOf(intent)),
            Fixtures.user,
        )
        assertEquals(2, rows.size)
        assertTrue(rows.any { it.pending?.key == intent.key })
    }

    @Test fun differentBodyWithSameRequestIdDoesNotHideLocalIntent() {
        val h = FeedHarness(StandardTestDispatcher())
        val intent = PendingMessage(UUID.randomUUID(), "Локальное", Fixtures.expiry)
        val rows = feedRows(
            FeedState(entries = listOf(h.entry(1, intent.key, "Другое"))),
            MessageState(queue = listOf(intent)),
            Fixtures.user,
        )
        assertEquals(2, rows.size)
        assertEquals(2, rows.map { it.key }.toSet().size)
        assertTrue(rows.any { it.pending?.text == "Локальное" })
    }
}
