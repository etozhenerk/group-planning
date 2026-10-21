@file:OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)

package dev.groupplanning.android.feed

import dev.groupplanning.android.data.api.WireResponse
import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.state.feed.FeedViewModel
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class FeedLoadingTests {
    @Test fun postAndLatestMetadataNeverSkipUnreadPagesAndHistoryKeepsCursor() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        h.page(10, 11, more = true, latest = 99)
        val model = FeedViewModel(h.id, h.repository, backgroundScope)
        val active = backgroundScope.launch { model.runActive() }
        runCurrent()
        assertEquals("11", model.state.value.cursor?.value)
        model.sender.edit("Привет")
        runCurrent()
        h.transport.handle("${h.path}/messages") {
            val pending = checkNotNull(model.sender.state.value.pending)
            WireResponse(201, "application/json", apiJson.encodeToString(h.entry(14, pending.key)))
        }
        model.sender.send()
        runCurrent()
        assertEquals("11", model.state.value.cursor?.value)
        h.page(12, 13, more = true, latest = 99)
        h.page(14, 15)
        model.refresh()
        runCurrent()
        assertEquals(
            listOf(10, 11, 12, 13, 14, 15),
            model.state.value.entries.map {
                it.sequence.value.toInt()
            },
        )
        assertEquals(
            listOf("11", "13"),
            h.transport.requests.filter {
                it.url.queryParameter("after_sequence") != null
            }.map { it.url.queryParameter("after_sequence") },
        )
        h.page(8, 9)
        model.history()
        runCurrent()
        assertEquals("15", model.state.value.cursor?.value)
        assertEquals(8, model.state.value.entries.size)
        assertFalse(model.state.value.hasHistory)
        active.cancel()
    }

    @Test fun lateHistoryCannotReturnAfterRevocationAndDiskIsCleared() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        h.page(10, more = true)
        val model = FeedViewModel(h.id, h.repository, backgroundScope)
        backgroundScope.launch { model.runActive() }
        runCurrent()
        model.sender.edit("Приватный черновик")
        runCurrent()
        val result = CompletableDeferred<WireResponse>()
        h.transport.handle("${h.path}/feed") { withContext(NonCancellable) { result.await() } }
        model.history()
        runCurrent()
        h.session.updateAccess(h.id, false)
        runCurrent()
        result.complete(WireResponse(200, "application/json", "{}"))
        runCurrent()
        assertTrue(model.state.value.revoked)
        assertTrue(model.state.value.entries.isEmpty())
        assertEquals("", model.sender.state.value.draft)
        assertTrue(h.disk.load().isEmpty())
    }

    @Test fun backgroundStopsPollingAndForegroundReadsImmediatelyWithBackoff() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        h.transport.enqueue("${h.path}/feed", "", 503)
        h.page(1)
        val model = FeedViewModel(h.id, h.repository, backgroundScope)
        var active = backgroundScope.launch { model.runActive() }
        runCurrent()
        assertTrue(model.state.value.loadError)
        val count = h.transport.requests.size
        advanceTimeBy(5_999)
        runCurrent()
        assertEquals(count, h.transport.requests.size)
        advanceTimeBy(1)
        runCurrent()
        assertTrue(model.state.value.ready)
        active.cancel()
        runCurrent()
        val paused = h.transport.requests.size
        advanceTimeBy(60_000)
        assertEquals(paused, h.transport.requests.size)
        h.page(2)
        active = backgroundScope.launch { model.runActive() }
        runCurrent()
        assertEquals(2, model.state.value.entries.size)
        active.cancel()
    }
}
