@file:OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)

package dev.groupplanning.android.feed

import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.state.feed.FeedViewModel
import dev.groupplanning.android.support.Fixtures
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.encodeToString
import okio.Buffer
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNotSame
import org.junit.Assert.assertNull
import org.junit.Assert.assertSame
import org.junit.Test

class ActionDraftTests {
    @Test fun discardedActionDraftsReopenCleanAndRevocationClearsCurrentForms() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        h.transport.enqueue(h.path, apiJson.encodeToString(Fixtures.meeting()))
        h.page()
        val model = FeedViewModel(h.id, h.repository, backgroundScope)
        backgroundScope.launch { model.runActive() }
        runCurrent()
        val initialReads = h.transport.requests.filter { it.method == "GET" }
        model.createPoll(Fixtures.meeting())
        val date = checkNotNull(model.pollCreation.value)
        date.change { it.copy(dates = listOf("2026-11-01", "2026-11-02")) }
        model.closePollCreation()
        assertNull(model.pollCreation.value)
        model.createPoll(Fixtures.meeting())
        val freshDate = checkNotNull(model.pollCreation.value)
        assertNotSame(date, freshDate)
        assertFalse(freshDate.dirty)
        assertNull(date.state.value.draft)

        model.createPlacePoll(Fixtures.meeting())
        val place = checkNotNull(model.placeCreation.value)
        place.change { it.copy(place = "Кафе", explanation = "Тихий зал") }
        model.closePlaceCreation()
        model.createPlacePoll(Fixtures.meeting())
        val freshPlace = checkNotNull(model.placeCreation.value)
        assertNotSame(place, freshPlace)
        assertEquals("", freshPlace.state.value.draft?.explanation)
        assertNull(place.state.value.draft)

        model.createPreparationTask()
        val task = checkNotNull(model.taskCreation.value)
        task.title("Заказать пиццу")
        model.closeTaskCreation()
        model.createPreparationTask()
        val freshTask = checkNotNull(model.taskCreation.value)
        assertNotSame(task, freshTask)
        assertEquals("", freshTask.state.value.title)
        assertEquals("", task.state.value.title)
        runCurrent()
        assertEquals(initialReads, h.transport.requests.filter { it.method == "GET" })

        h.session.updateAccess(h.id, false)
        runCurrent()
        assertNull(freshDate.state.value.draft)
        assertNull(freshPlace.state.value.draft)
        assertEquals("", freshTask.state.value.title)
        assertNull(model.pollCreation.value)
        assertNull(model.placeCreation.value)
        assertNull(model.taskCreation.value)
        model.createPreparationTask()
        assertNull(model.taskCreation.value)
    }

    @Test fun uncertainDateAndPlaceCreationSurviveCloseWithTheirOriginalRequest() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        h.transport.enqueue(h.path, apiJson.encodeToString(Fixtures.meeting()))
        h.page()
        val model = FeedViewModel(h.id, h.repository, backgroundScope)
        backgroundScope.launch { model.runActive() }
        runCurrent()
        model.createPoll(Fixtures.meeting())
        val date = checkNotNull(model.pollCreation.value)
        h.transport.enqueue("${h.path}/date-polls", "", 503)
        date.create()
        runCurrent()
        val dateRequest = checkNotNull(date.state.value.pending)
        assertFalse(date.state.value.busy)
        h.page()
        model.closePollCreation()
        runCurrent()
        assertSame(date, model.pollCreation.value)
        model.createPoll(Fixtures.meeting())
        assertSame(date, model.pollCreation.value)
        assertSame(dateRequest, date.state.value.pending)
        h.transport.enqueue("${h.path}/date-polls", "", 503)
        date.create()
        runCurrent()
        assertRequestRepeatedExactly(h, "/date-polls")
        h.page()
        model.closePollCreation()
        runCurrent()

        model.createPlacePoll(Fixtures.meeting())
        val place = checkNotNull(model.placeCreation.value)
        place.change { it.copy(place = "Кафе у парка", explanation = "Тихий зал") }
        h.transport.enqueue("${h.path}/place-polls", "", 503)
        place.create()
        runCurrent()
        val placeRequest = checkNotNull(place.state.value.pending)
        assertFalse(place.state.value.busy)
        h.page()
        model.closePlaceCreation()
        runCurrent()
        assertSame(place, model.placeCreation.value)
        model.createPlacePoll(Fixtures.meeting())
        assertSame(place, model.placeCreation.value)
        assertSame(placeRequest, place.state.value.pending)
        h.transport.enqueue("${h.path}/place-polls", "", 503)
        place.create()
        runCurrent()
        assertRequestRepeatedExactly(h, "/place-polls")
        model.stop()
        assertNull(date.state.value.pending)
        assertNull(place.state.value.pending)
    }

    @Test fun uncertainTaskCreationSurvivesCloseAndRevocationClearsItsPendingRequest() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        h.transport.enqueue(h.path, apiJson.encodeToString(Fixtures.meeting()))
        h.page()
        val model = FeedViewModel(h.id, h.repository, backgroundScope)
        backgroundScope.launch { model.runActive() }
        runCurrent()
        model.createPreparationTask()
        val task = checkNotNull(model.taskCreation.value)
        h.transport.enqueue("${h.path}/participants", "{\"participants\":[]}")
        task.loadPeople()
        task.title("Заказать пиццу")
        h.transport.enqueue("${h.path}/preparation-tasks", "", 503)
        task.create()
        runCurrent()
        val request = checkNotNull(task.operation.state.value.pending)
        h.page()
        model.closeTaskCreation()
        runCurrent()
        assertSame(task, model.taskCreation.value)
        model.createPreparationTask()
        assertSame(task, model.taskCreation.value)
        assertSame(request, task.operation.state.value.pending)
        assertEquals("Заказать пиццу", task.state.value.title)
        h.transport.enqueue("${h.path}/preparation-tasks", "", 503)
        task.create()
        runCurrent()
        assertRequestRepeatedExactly(h, "/preparation-tasks")
        h.page()
        model.closeTaskCreation()
        runCurrent()
        h.session.updateAccess(h.id, false)
        runCurrent()
        assertNull(task.operation.state.value.pending)
        assertEquals("", task.state.value.title)
    }

    private fun assertRequestRepeatedExactly(harness: FeedHarness, suffix: String) {
        val writes = harness.transport.requests.filter {
            it.method == "POST" && it.url.encodedPath.endsWith(suffix)
        }
        assertEquals(2, writes.size)
        assertNotNull(writes.first().header("Idempotency-Key"))
        assertEquals(writes[0].header("Idempotency-Key"), writes[1].header("Idempotency-Key"))
        val bodies = writes.map { request ->
            Buffer().also { request.body?.writeTo(it) }.readUtf8()
        }
        assertEquals(bodies[0], bodies[1])
    }
}
