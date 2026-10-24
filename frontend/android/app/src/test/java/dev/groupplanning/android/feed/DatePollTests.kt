@file:OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)

package dev.groupplanning.android.feed

import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.DatePoll
import dev.groupplanning.android.data.api.requests.DatePollRequests
import dev.groupplanning.android.state.datepoll.DatePollIssue
import dev.groupplanning.android.state.datepoll.DatePollViewModel
import dev.groupplanning.android.support.Fixtures
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonPrimitive
import okio.Buffer
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class DatePollTests {
    private fun poll(): DatePoll =
        apiJson.decodeFromString<DatePoll>(Fixtures.json("date-poll-hidden"))
            .copy(meetingId = Fixtures.meetingId)

    @Test fun uncertainVoteRetriesSameBodyAndKeyWithoutExposingResults() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val poll = poll()
        val model = DatePollViewModel(h.repository, h.repository.open(h.id), backgroundScope)
        val path = "${h.path}/date-polls/${poll.id}"
        h.transport.enqueue(path, apiJson.encodeToString(poll))
        model.load(poll.id)
        val chosen = poll.options.last().id
        model.choose(chosen)
        val selected = model.state.value.selected
        h.transport.enqueue("$path/vote", "", 503)
        model.vote()
        runCurrent()
        assertNotNull(model.state.value.pending)
        assertFalse(model.state.value.editable)
        model.choose(chosen)
        assertEquals(selected, model.state.value.selected)
        h.transport.enqueue(
            "$path/vote",
            apiJson.encodeToString(poll.copy(myOptionIds = selected.toList())),
        )
        model.retry()
        runCurrent()
        val sent = h.transport.requests.filter { it.method == "PUT" }
        assertEquals(2, sent.size)
        assertEquals(sent[0].header("Idempotency-Key"), sent[1].header("Idempotency-Key"))
        val bodies = sent.map { request -> Buffer().also { request.body?.writeTo(it) }.readUtf8() }
        assertEquals(bodies[0], bodies[1])
        assertNull(model.state.value.pending)
        assertTrue(
            checkNotNull(model.state.value.poll).options.all {
                it.votes == null &&
                    it.voters == null
            },
        )
    }

    @Test fun conflictPreservesChoiceAndClosedPollCannotChangeSelection() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val poll = poll()
        val model = DatePollViewModel(h.repository, h.repository.open(h.id), backgroundScope)
        val path = "${h.path}/date-polls/${poll.id}"
        h.transport.enqueue(path, apiJson.encodeToString(poll))
        model.load(poll.id)
        val chosen = poll.options.last().id
        model.choose(chosen)
        val selected = model.state.value.selected
        h.transport.enqueue("$path/vote", "", 409)
        h.transport.enqueue(
            path,
            apiJson.encodeToString(
                poll.copy(state = "cancelled", canVote = false, canAddOptions = false),
            ),
        )
        model.vote()
        runCurrent()
        assertEquals(DatePollIssue.Conflict, model.state.value.issue)
        assertEquals("cancelled", model.state.value.poll?.state)
        assertEquals(selected, model.state.value.selected)
        model.choose(chosen)
        assertEquals(selected, model.state.value.selected)
        assertNull(model.state.value.pending)
    }

    @Test fun resolveDistinguishesUnspecifiedTimeFromExplicitlyClearedTime() {
        val poll = poll()
        val fields = mapOf("option_id" to JsonPrimitive(poll.options.first().id.toString()))
        val choice = DatePollRequests.action(poll, "resolve", fields)
        val clear = DatePollRequests.action(poll, "resolve", fields + ("starts_at" to JsonNull))
        assertFalse(checkNotNull(choice.body).contains("starts_at"))
        assertTrue(checkNotNull(clear.body).contains("\"starts_at\":null"))
        assertFalse(clear.revokesAccessOnForbidden)
    }
}
