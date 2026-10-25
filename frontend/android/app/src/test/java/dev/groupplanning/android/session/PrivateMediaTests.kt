package dev.groupplanning.android.session

import dev.groupplanning.android.data.api.ApiRequest
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.feed.FeedHarness
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

class PrivateMediaTests {
    @Test fun binaryContentUsesTheSessionOriginAnd403RevokesItsMeeting() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val access = h.repository.open(h.id)
        val path = "${h.path}/media/00000000-0000-0000-0000-000000000001/content"
        val request = ApiRequest(path.split('/'), meetingId = h.id, revokesAccessOnForbidden = true)
        h.transport.enqueue(path, "pdf", mime = "application/pdf")
        assertArrayEquals("pdf".toByteArray(), h.session.content(request, access.request))
        assertEquals("example.test", h.transport.requests.last().url.host)
        assertNotNull(h.transport.requests.last().header("Authorization"))
        h.transport.enqueue(path, status = 403)
        try {
            h.session.content(request, access.request)
        } catch (_: ClientFailure) {
            assertTrue(h.id in h.session.state.value.data.denied)
        }
        assertTrue(h.id in h.session.state.value.data.denied)
    }
}
