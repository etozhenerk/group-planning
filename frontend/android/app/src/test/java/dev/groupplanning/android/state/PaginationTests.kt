package dev.groupplanning.android.state

import dev.groupplanning.android.data.api.WireResponse
import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.MeetingsPage
import dev.groupplanning.android.support.Fixtures
import dev.groupplanning.android.support.SessionHarness
import java.util.UUID
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.encodeToString
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

@OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)
class PaginationTests {
    @Test fun pageFailureRetriesSameCursorAndDeduplicates() = runTest {
        val h = SessionHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val first = Fixtures.summary()
        val second = Fixtures.summary(UUID.randomUUID())
        h.transport.enqueue("meetings", apiJson.encodeToString(MeetingsPage(listOf(first), "next")))
        h.meetings.loadMeetings()
        h.transport.enqueue("meetings", status = 503)
        h.meetings.loadMore()
        assertNotNull(h.session.state.value.data.moreError)
        assertNull(h.session.state.value.data.moreRequest)
        h.transport.enqueue(
            "meetings",
            apiJson.encodeToString(MeetingsPage(listOf(first, second), null)),
        )
        h.meetings.loadMore()
        assertEquals(
            listOf(first.id, second.id),
            h.session.state.value.data.meetings.value?.meetings?.map {
                it.id
            },
        )
        assertEquals("next", h.transport.requests.last().url.queryParameter("cursor"))
    }

    @Test fun refreshWinsOverLateNextPage() = runTest {
        val h = SessionHarness(StandardTestDispatcher(testScheduler))
        h.login()
        h.transport.enqueue(
            "meetings",
            apiJson.encodeToString(MeetingsPage(listOf(Fixtures.summary()), "next")),
        )
        h.meetings.loadMeetings()
        val release = CompletableDeferred<Unit>()
        h.transport.handle("meetings") {
            release.await()
            WireResponse(
                200,
                "application/json",
                apiJson.encodeToString(
                    MeetingsPage(listOf(Fixtures.summary(UUID.randomUUID())), null),
                ),
            )
        }
        val old = launch { h.meetings.loadMore() }
        runCurrent()
        h.transport.enqueue("meetings", apiJson.encodeToString(MeetingsPage(emptyList(), null)))
        h.meetings.loadMeetings()
        release.complete(Unit)
        old.join()
        assertEquals(emptyList<Any>(), h.session.state.value.data.meetings.value?.meetings)
        assertNull(h.session.state.value.data.moreRequest)
    }
}
