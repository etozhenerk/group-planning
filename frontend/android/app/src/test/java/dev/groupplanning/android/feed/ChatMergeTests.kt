package dev.groupplanning.android.feed

import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.models.ChatChange
import dev.groupplanning.android.data.api.models.ServerCounter
import dev.groupplanning.android.state.feed.ChatHistoryInvalidated
import dev.groupplanning.android.state.feed.FeedState
import dev.groupplanning.android.state.feed.apply
import dev.groupplanning.android.state.feed.install
import java.util.UUID
import kotlinx.coroutines.test.StandardTestDispatcher
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ChatMergeTests {
    private val h = FeedHarness(StandardTestDispatcher())

    @Test fun ackAndHistoryDoNotMoveDurableCursorAndDuplicateProjectionDoesNotRegress() {
        val initial = FeedState().install(ChatFixtures.snapshot(listOf(h.entry(100)))).state
        val ack = initial.merge(listOf(h.entry(102, UUID.randomUUID())))
        assertEquals("c1", ack.changeCursor)
        val result = ack.apply(ChatFixtures.changes(listOf(h.entry(101), h.entry(102)), "c2")).state
        assertEquals(listOf("100", "101", "102"), result.entries.map { it.sequence.value })
        assertEquals("c2", result.changeCursor)
        val old = result.apply(
            ChatFixtures.changes(listOf(h.entry(101, text = "Старое")), "c3", version = "1"),
        ).state
        assertEquals("Сообщение 101", old.entries[1].messageText)
        assertEquals("c3", old.merge(listOf(h.entry(99)), false).changeCursor)
    }

    @Test fun throughBarrierIsFixedAndInvalidPageCannotMutatePriorState() {
        val first = FeedState().install(ChatFixtures.snapshot(listOf(h.entry(1)))).state
            .apply(ChatFixtures.changes(listOf(h.entry(2)), "page2", "through3", true)).state
        assertEquals("through3", first.throughCursor)
        try {
            first.apply(ChatFixtures.changes(listOf(h.entry(3)), "page3", "through4"))
            error("Expected fixed barrier validation")
        } catch (_: ClientFailure) { }
        assertEquals(listOf("1", "2"), first.entries.map { it.sequence.value })
        assertEquals("page2", first.changeCursor)
        val last = first.apply(ChatFixtures.changes(listOf(h.entry(3)), "c3", "through3")).state
        assertEquals(null, last.throughCursor)
    }

    @Test fun invalidationAndEpochChangeRequireFreshWindowInsteadOfAppend() {
        val state = FeedState().install(ChatFixtures.snapshot(listOf(h.entry(1)))).state
        try {
            state.apply(ChatFixtures.changes(epoch = "new"))
            error("Expected epoch mismatch")
        } catch (_: ClientFailure) { }
        try {
            state.apply(
                ChatFixtures.changes().copy(
                    changes = listOf(
                        ChatChange("history_invalidated", ServerCounter("3")),
                    ),
                ),
            )
            error("Expected invalidation")
        } catch (_: ChatHistoryInvalidated) { }
        val fresh = state.install(ChatFixtures.snapshot(listOf(h.entry(2)), "new", "new")).state
        assertEquals(listOf("2"), fresh.entries.map { it.sequence.value })
    }

    @Test fun windowRemainsBoundedAroundReaderAndDiscardedEdgesCanReload() {
        var state = FeedState(anchor = h.entry(500).id)
        for (range in (1..2000).chunked(50)) state = state.merge(range.map { h.entry(it) })
        assertEquals(500, state.entries.size)
        assertTrue(state.entries.any { it.sequence.value == "500" })
        assertTrue(state.hasHistory)
        assertTrue(state.hasNewer)
        val before = state.entries.first().sequence.value.toInt()
        state =
            state.copy(anchor = state.entries.first().id).merge(
                ((before - 50) until before).map {
                    h.entry(it)
                },
            )
        assertEquals(500, state.entries.size)
        assertFalse(state.entries.any { it.sequence.value == "2000" })
    }
}
