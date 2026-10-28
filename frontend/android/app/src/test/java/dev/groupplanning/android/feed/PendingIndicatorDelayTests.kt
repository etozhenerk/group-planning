package dev.groupplanning.android.feed

import dev.groupplanning.android.state.feed.pendingIndicatorDelay
import java.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Test

class PendingIndicatorDelayTests {
    @Test fun remainingDelayUsesOriginalEnqueueIncludingRestoredAndFutureClockValues() {
        val enqueued = Instant.parse("2026-10-28T12:00:00Z")
        assertEquals(2000L, pendingIndicatorDelay(enqueued, enqueued, 2000))
        assertEquals(500L, pendingIndicatorDelay(enqueued, enqueued.plusMillis(1500), 2000))
        assertEquals(0L, pendingIndicatorDelay(enqueued, enqueued.plusMillis(2000), 2000))
        assertEquals(0L, pendingIndicatorDelay(enqueued, enqueued.plusSeconds(60), 2000))
        assertEquals(2000L, pendingIndicatorDelay(enqueued, enqueued.minusSeconds(60), 2000))
    }
}
