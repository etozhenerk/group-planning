@file:OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)

package dev.groupplanning.android.feed

import dev.groupplanning.android.data.api.WireResponse
import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.ApiInstant
import dev.groupplanning.android.data.api.models.PlacePoll
import dev.groupplanning.android.data.api.requests.PlacePollRequests
import dev.groupplanning.android.state.placepoll.PlacePollIssue
import dev.groupplanning.android.state.placepoll.PlacePollViewModel
import dev.groupplanning.android.support.Fixtures
import java.time.Instant
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.encodeToString
import okio.Buffer
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class PlacePollTests {
    private fun poll(): PlacePoll = apiJson.decodeFromString<PlacePoll>(
        Fixtures.json("place-poll-open"),
    ).copy(
        meetingId = Fixtures.meetingId,
        closesAt = ApiInstant(Instant.now().plusSeconds(3600).toString()),
    )

    @Test fun uncertainVoteKeepsAnswerAndRetriesExactly() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val poll = poll()
        val model = PlacePollViewModel(h.repository, h.repository.open(h.id), backgroundScope)
        val path = "${h.path}/place-polls/${poll.id}"
        h.transport.enqueue(path, apiJson.encodeToString(poll))
        model.load(poll.id)
        h.transport.enqueue("$path/vote", "", 503)
        model.vote("against")
        runCurrent()
        assertNotNull(model.state.value.pending)
        assertFalse(model.state.value.editable)
        assertEquals("for", model.state.value.poll?.myVote)
        h.transport.enqueue("$path/vote", apiJson.encodeToString(poll.copy(myVote = "against")))
        model.retry()
        runCurrent()
        val sent = h.transport.requests.filter { it.method == "PUT" }
        assertEquals(2, sent.size)
        assertEquals(sent[0].header("Idempotency-Key"), sent[1].header("Idempotency-Key"))
        val bodies = sent.map { request -> Buffer().also { request.body?.writeTo(it) }.readUtf8() }
        assertEquals(bodies[0], bodies[1])
        assertNull(model.state.value.pending)
        assertEquals("against", model.state.value.poll?.myVote)
    }

    @Test fun conflictRefreshAndDeadlinePreventFurtherVote() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val poll = poll()
        val model = PlacePollViewModel(h.repository, h.repository.open(h.id), backgroundScope)
        val path = "${h.path}/place-polls/${poll.id}"
        h.transport.enqueue(path, apiJson.encodeToString(poll))
        model.load(poll.id)
        h.transport.enqueue("$path/vote", "", 409)
        h.transport.enqueue(
            path,
            apiJson.encodeToString(poll.copy(state = "cancelled", canVote = false)),
        )
        model.vote("against")
        runCurrent()
        assertEquals(PlacePollIssue.Conflict, model.state.value.issue)
        assertEquals("cancelled", model.state.value.poll?.state)
        assertNull(model.state.value.pending)
        val count = h.transport.requests.size
        model.vote("for")
        runCurrent()
        assertEquals(count, h.transport.requests.size)
        h.transport.enqueue(
            path,
            apiJson.encodeToString(poll.copy(closesAt = ApiInstant("2020-01-01T00:00:00Z"))),
        )
        model.load(poll.id)
        val afterRead = h.transport.requests.size
        model.vote("for")
        runCurrent()
        assertEquals(afterRead, h.transport.requests.size)
    }

    @Test fun loadFailureRetainsCardAndStopClearsIt() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val poll = poll()
        val model = PlacePollViewModel(h.repository, h.repository.open(h.id), backgroundScope)
        val path = "${h.path}/place-polls/${poll.id}"
        h.transport.enqueue(path, apiJson.encodeToString(poll))
        model.load(poll.id)
        h.transport.enqueue(path, "", 503)
        model.load(poll.id)
        assertEquals(poll, model.state.value.poll)
        assertEquals(PlacePollIssue.Load, model.state.value.issue)
        model.stop()
        model.load(poll.id)
        assertNull(model.state.value.poll)
    }

    @Test fun lateReadCannotRestoreRevokedAccess() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val poll = poll()
        val model = PlacePollViewModel(h.repository, h.repository.open(h.id), backgroundScope)
        val result = CompletableDeferred<WireResponse>()
        h.transport.handle("${h.path}/place-polls/${poll.id}") { result.await() }
        val reading = launch { model.load(poll.id) }
        runCurrent()
        h.session.updateAccess(h.id, false)
        result.complete(WireResponse(200, "application/json", apiJson.encodeToString(poll)))
        reading.join()
        assertNull(model.state.value.poll)
        model.stop()
        assertNull(model.state.value.pending)
    }

    @Test fun invalidCreationMakesNoWriteAndRequestsBindMeetingAccess() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val model =
            PlacePollViewModel(
                h.repository,
                h.repository.open(h.id),
                backgroundScope,
                Fixtures.meeting(),
            )
        model.create()
        runCurrent()
        assertEquals(PlacePollIssue.Place, model.state.value.issue)
        assertTrue(h.transport.requests.none { it.method == "POST" })
        val create = PlacePollRequests.create(
            h.id,
            "У Саши",
            Instant.now().plusSeconds(100).toString(),
        )
        val vote = PlacePollRequests.vote(poll(), "for")
        assertEquals(h.id, create.meetingId)
        assertTrue(create.revokesAccessOnForbidden && vote.revokesAccessOnForbidden)
        assertEquals(201, create.expectedStatus)
        assertTrue(checkNotNull(vote.body).contains("expected_revision"))
    }
}
