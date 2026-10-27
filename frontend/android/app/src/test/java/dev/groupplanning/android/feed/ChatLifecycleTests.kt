@file:OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)

package dev.groupplanning.android.feed

import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.realtime.ChatRealtime
import dev.groupplanning.android.data.realtime.ChatSignal
import dev.groupplanning.android.data.repository.FeedRepository
import dev.groupplanning.android.state.feed.FeedState
import dev.groupplanning.android.state.feed.FeedSync
import dev.groupplanning.android.state.feed.MessageSender
import dev.groupplanning.android.support.Fixtures
import java.util.UUID
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.encodeToString
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

private class FakeRealtime : ChatRealtime {
    val signals = MutableSharedFlow<ChatSignal>(extraBufferCapacity = 8)
    var opens = 0
    var closes = 0
    override fun events(token: String, owner: UUID, meeting: UUID) = flow {
        opens++
        try {
            signals.collect { emit(it) }
        } finally {
            closes++
        }
    }
}

class ChatLifecycleTests {
    @Test fun snapshotSubscribeCatchesUpWithoutIdlePollingAndStopsInBackground() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login(sync = true, realtime = true)
        val transport = FakeRealtime()
        val repository = FeedRepository(h.session, h.outbox, realtime = transport)
        val state = MutableStateFlow(FeedState())
        val sender = MessageSender(repository, backgroundScope) {}
        val sync = FeedSync(repository, state, sender, jitter = { it }) { _, _, _ -> }
        h.transport.enqueue(
            "${h.path}/sync",
            apiJson.encodeToString(ChatFixtures.snapshot(listOf(h.entry(100)))),
        )
        h.transport.enqueue("${h.path}/sync", apiJson.encodeToString(ChatFixtures.changes()))
        val job = backgroundScope.launch { sync.run(repository.open(h.id)) }
        runCurrent()
        assertEquals(1, transport.opens)
        h.transport.enqueue(
            "${h.path}/sync",
            apiJson.encodeToString(ChatFixtures.changes(listOf(h.entry(101)), "c2")),
        )
        h.transport.enqueue("meetings", "{\"meetings\":[],\"next_cursor\":null}")
        transport.signals.emit(ChatSignal.Subscribed)
        runCurrent()
        assertEquals(listOf("100", "101"), state.value.entries.map { it.sequence.value })
        val requests = h.transport.requests.size
        advanceTimeBy(60_000)
        runCurrent()
        assertEquals(requests, h.transport.requests.size)
        job.cancel()
        runCurrent()
        assertEquals(1, transport.closes)
        advanceTimeBy(60_000)
        assertEquals(requests, h.transport.requests.size)
    }

    @Test fun offlineTransportUsesOneBoundedFallbackAndSubscribeStopsIt() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login(sync = true, realtime = true)
        val realtime = FakeRealtime()
        val repository = FeedRepository(h.session, h.outbox, realtime = realtime)
        val state = MutableStateFlow(FeedState())
        val sync =
            FeedSync(
                repository,
                state,
                MessageSender(repository, backgroundScope) {
                },
                jitter = { it },
            ) { _, _, _ -> }
        h.transport.enqueue(
            "${h.path}/sync",
            apiJson.encodeToString(ChatFixtures.snapshot(emptyList())),
        )
        h.transport.enqueue("${h.path}/sync", apiJson.encodeToString(ChatFixtures.changes()))
        backgroundScope.launch { sync.run(repository.open(h.id)) }
        runCurrent()
        val count = h.transport.requests.size
        repeat(5) { realtime.signals.emit(ChatSignal.Disconnected) }
        runCurrent()
        advanceTimeBy(9_999)
        runCurrent()
        assertEquals(count, h.transport.requests.size)
        h.transport.enqueue(
            "${h.path}/sync",
            apiJson.encodeToString(ChatFixtures.changes(cursor = "c2")),
        )
        advanceTimeBy(1)
        runCurrent()
        assertEquals(count + 1, h.transport.requests.size)
        h.transport.enqueue(
            "${h.path}/sync",
            apiJson.encodeToString(ChatFixtures.changes(cursor = "c3")),
        )
        h.transport.enqueue("meetings", "{\"meetings\":[],\"next_cursor\":null}")
        realtime.signals.emit(ChatSignal.Subscribed)
        runCurrent()
        val subscribed = h.transport.requests.size
        advanceTimeBy(60_000)
        runCurrent()
        assertEquals(subscribed, h.transport.requests.size)
    }

    @Test fun expiredCursorReplacesWindowAndKeepsDraftThenRevocationClearsDisk() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login(sync = true, realtime = true)
        val realtime = FakeRealtime()
        val repository = FeedRepository(h.session, h.outbox, realtime = realtime)
        val state = MutableStateFlow(FeedState())
        val sender = MessageSender(repository, backgroundScope) {}
        val sync = FeedSync(repository, state, sender, jitter = { it }) { _, _, _ -> }
        h.transport.enqueue(
            "${h.path}/sync",
            apiJson.encodeToString(ChatFixtures.snapshot(listOf(h.entry(1)))),
        )
        h.transport.enqueue("${h.path}/sync", apiJson.encodeToString(ChatFixtures.changes()))
        backgroundScope.launch { sync.run(repository.open(h.id)) }
        runCurrent()
        sender.edit("Черновик")
        runCurrent()
        h.transport.enqueue("${h.path}/sync", Fixtures.json("chat-sync-reset"), 410)
        h.transport.enqueue(
            "${h.path}/sync",
            apiJson.encodeToString(ChatFixtures.snapshot(listOf(h.entry(2)), "fresh", "new")),
        )
        h.transport.enqueue("meetings", "{\"meetings\":[],\"next_cursor\":null}")
        realtime.signals.emit(ChatSignal.Subscribed)
        runCurrent()
        assertEquals(listOf("2"), state.value.entries.map { it.sequence.value })
        assertEquals("fresh", state.value.changeCursor)
        assertEquals("Черновик", sender.state.value.draft)
        realtime.signals.emit(ChatSignal.AccessRevoked)
        runCurrent()
        assertTrue(h.disk.load().isEmpty())
        assertTrue(h.id in h.session.state.value.data.denied)
    }
}
