@file:OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)

package dev.groupplanning.android.feed

import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.ChatMessageReaders
import dev.groupplanning.android.data.api.models.ChatReadInfo
import dev.groupplanning.android.data.api.models.ChatReadReceipts
import dev.groupplanning.android.data.api.models.ChatReadState
import dev.groupplanning.android.data.api.models.ChatReceipt
import dev.groupplanning.android.data.api.models.ServerCounter
import dev.groupplanning.android.state.feed.ChatReadController
import dev.groupplanning.android.support.Fixtures
import java.util.UUID
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.encodeToString
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class ChatReadingTests {
    private fun info(actual: String = "0", baseline: String = "100") = ChatReadInfo(
        ServerCounter(actual),
        ServerCounter(baseline),
        ServerCounter("1"),
        null,
    )

    @Test fun onlyContinuousVisibleBottomQualifiesAndOverlayOrBackgroundDoesNotRead() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val model =
            ChatReadController(h.repository.reading, backgroundScope) { testScheduler.currentTime }
        model.enter(h.repository.open(h.id))
        model.synchronize(true, info(), ServerCounter("1"))
        val entry = h.entry(101).copy(actor = Fixtures.user.copy(id = UUID.randomUUID()))
        model.visible(listOf(entry), emptyList(), true)
        advanceTimeBy(1_000)
        runCurrent()
        assertFalse(h.transport.requests.any { it.method == "PUT" })
        model.visible(listOf(entry), listOf(entry), true)
        advanceTimeBy(499)
        runCurrent()
        model.visible(listOf(entry), listOf(entry), false)
        advanceTimeBy(1_000)
        runCurrent()
        assertFalse(h.transport.requests.any { it.method == "PUT" })
        h.transport.enqueue(
            "${h.path}/read-marker",
            apiJson.encodeToString(
                ChatReadState(
                    ServerCounter("101"),
                    ServerCounter("100"),
                    ServerCounter.Zero,
                    null,
                    ServerCounter("2"),
                ),
            ),
        )
        model.visible(listOf(entry), listOf(entry), true)
        advanceTimeBy(500)
        runCurrent()
        assertEquals(ServerCounter("101"), model.state.value.info?.actual)
        model.leave()
        model.visible(listOf(entry), listOf(h.entry(102)), true)
        advanceTimeBy(2_000)
        runCurrent()
        assertEquals(1, h.transport.requests.count { it.method == "PUT" })
    }

    @Test fun serverMaximumNeverRegressesAndCoalescingDoesNotCreateNoOpLoop() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val model =
            ChatReadController(h.repository.reading, backgroundScope) { testScheduler.currentTime }
        model.enter(h.repository.open(h.id))
        model.synchronize(true, info("0", "0"), ServerCounter("1"))
        val first = h.entry(1).copy(actor = Fixtures.user.copy(id = UUID.randomUUID()))
        h.transport.enqueue(
            "${h.path}/read-marker",
            apiJson.encodeToString(
                ChatReadState(
                    ServerCounter("10"),
                    ServerCounter.Zero,
                    ServerCounter.Zero,
                    null,
                    ServerCounter("10"),
                ),
            ),
        )
        model.visible(listOf(first), listOf(first), true)
        advanceTimeBy(500)
        runCurrent()
        assertEquals(ServerCounter("10"), model.state.value.info?.actual)
        model.synchronize(true, info("2", "0"), ServerCounter("2"))
        repeat(3) {
            model.visible(listOf(first), listOf(first), true)
            runCurrent()
        }
        advanceTimeBy(5_000)
        runCurrent()
        assertEquals(1, h.transport.requests.count { it.method == "PUT" })
        assertEquals(ServerCounter("10"), model.state.value.info?.actual)
    }

    @Test fun staggeredVisibleEdgesEachGetTheirOwnDwellAndMarkerIsThrottled() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val model =
            ChatReadController(h.repository.reading, backgroundScope) { testScheduler.currentTime }
        model.enter(h.repository.open(h.id))
        model.synchronize(true, info("0", "0"), ServerCounter("1"))
        val other = Fixtures.user.copy(id = UUID.randomUUID())
        val one = h.entry(1).copy(actor = other)
        val two = h.entry(2).copy(actor = other)
        h.transport.enqueue(
            "${h.path}/read-marker",
            apiJson.encodeToString(
                ChatReadState(
                    ServerCounter("1"),
                    ServerCounter.Zero,
                    ServerCounter("1"),
                    two.id,
                    ServerCounter("2"),
                ),
            ),
        )
        h.transport.enqueue(
            "${h.path}/read-marker",
            apiJson.encodeToString(
                ChatReadState(
                    ServerCounter("2"),
                    ServerCounter.Zero,
                    ServerCounter.Zero,
                    null,
                    ServerCounter("3"),
                ),
            ),
        )
        model.visible(listOf(one), listOf(one), true)
        advanceTimeBy(400)
        runCurrent()
        model.visible(listOf(one, two), listOf(one, two), true)
        advanceTimeBy(100)
        runCurrent()
        assertEquals(1, h.transport.requests.count { it.method == "PUT" })
        advanceTimeBy(999)
        runCurrent()
        assertEquals(1, h.transport.requests.count { it.method == "PUT" })
        advanceTimeBy(1)
        runCurrent()
        assertEquals(2, h.transport.requests.count { it.method == "PUT" })
        assertEquals(ServerCounter("2"), model.state.value.info?.actual)
    }

    @Test fun readersExpiredPageReplacesOldPeopleAndRevokeErasesPrivateState() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val model =
            ChatReadController(h.repository.reading, backgroundScope) { testScheduler.currentTime }
        model.enter(h.repository.open(h.id))
        model.synchronize(true, info(), ServerCounter("1"))
        val entry = h.entry(1)
        val a = Fixtures.user.copy(id = UUID.randomUUID(), displayName = "Аня")
        val b = a.copy(id = UUID.randomUUID(), displayName = "Борис")
        h.transport.enqueue(
            "${h.path}/read-receipts/query",
            apiJson.encodeToString(
                ChatReadReceipts(
                    listOf(ChatReceipt(entry.id, ServerCounter("2"))),
                    ServerCounter("1"),
                ),
            ),
        )
        model.visible(listOf(entry), emptyList(), false)
        runCurrent()
        assertEquals(ServerCounter("2"), model.state.value.counts[entry.id])
        val path = "${h.path}/messages/${entry.id}/readers"
        h.transport.enqueue(
            path,
            apiJson.encodeToString(
                ChatMessageReaders(listOf(a), ServerCounter("2"), "next", ServerCounter("1")),
            ),
        )
        model.openReaders(entry)
        runCurrent()
        h.transport.enqueue(path, Fixtures.json("chat-sync-reset"), 410)
        h.transport.enqueue(
            path,
            apiJson.encodeToString(
                ChatMessageReaders(listOf(b), ServerCounter("1"), null, ServerCounter("2")),
            ),
        )
        model.loadReaders(true)
        runCurrent()
        assertEquals(listOf(b), model.state.value.readers)
        assertNull(model.state.value.nextCursor)
        model.revoke()
        assertTrue(model.state.value.readers.isEmpty())
        assertTrue(model.state.value.counts.isEmpty())
        assertFalse(model.state.value.enabled)
    }
}
