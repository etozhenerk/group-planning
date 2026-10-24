@file:OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)

package dev.groupplanning.android.feed

import dev.groupplanning.android.data.api.WireResponse
import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.PreparationAction
import dev.groupplanning.android.data.api.models.PreparationTask
import dev.groupplanning.android.data.api.requests.PreparationTaskRequests
import dev.groupplanning.android.state.preparation.PreparationFormIssue
import dev.groupplanning.android.state.preparation.PreparationFormViewModel
import dev.groupplanning.android.state.preparation.PreparationTaskIssue
import dev.groupplanning.android.state.preparation.PreparationTaskViewModel
import dev.groupplanning.android.support.Fixtures
import java.util.UUID
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.jsonObject
import okio.Buffer
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class PreparationTaskTests {
    private fun task(): PreparationTask = apiJson.decodeFromString<PreparationTask>(
        Fixtures.json("preparation-task-offered"),
    ).copy(meetingId = Fixtures.meetingId, canAccept = true)

    @Test fun uncertainAcceptanceRetainsOfferedStateAndRetriesExactly() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val task = task()
        val model = PreparationTaskViewModel(h.repository, h.repository.open(h.id), backgroundScope)
        val path = "${h.path}/preparation-tasks/${task.id}"
        h.transport.enqueue(path, apiJson.encodeToString(task))
        model.load(task.id)
        h.transport.enqueue("$path/accept", "", 503)
        model.act(PreparationAction.Accept)
        runCurrent()
        assertNotNull(model.state.value.pending)
        assertFalse(model.state.value.editable)
        assertEquals(task, model.state.value.task)
        assertNull(model.state.value.task?.assignee)
        h.transport.enqueue("$path/accept", apiJson.encodeToString(task.copy(state = "accepted")))
        model.retry()
        runCurrent()
        val sent = h.transport.requests.filter { it.method == "POST" }
        assertEquals(2, sent.size)
        assertEquals(sent[0].header("Idempotency-Key"), sent[1].header("Idempotency-Key"))
        val bodies = sent.map { request -> Buffer().also { request.body?.writeTo(it) }.readUtf8() }
        assertEquals(bodies[0], bodies[1])
        assertNull(model.state.value.pending)
        assertEquals("accepted", model.state.value.task?.state)
    }

    @Test fun conflictLoadsCurrentTaskAndPreventsAnotherAcceptance() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val task = task()
        val model = PreparationTaskViewModel(h.repository, h.repository.open(h.id), backgroundScope)
        val path = "${h.path}/preparation-tasks/${task.id}"
        h.transport.enqueue(path, apiJson.encodeToString(task))
        model.load(task.id)
        h.transport.enqueue("$path/accept", "", 409)
        val accepted = task.copy(state = "accepted", canAccept = false)
        h.transport.enqueue(path, apiJson.encodeToString(accepted))
        model.act(PreparationAction.Accept)
        runCurrent()
        assertEquals(PreparationTaskIssue.Conflict, model.state.value.issue)
        assertEquals(accepted, model.state.value.task)
        assertNull(model.state.value.pending)
        val count = h.transport.requests.size
        model.act(PreparationAction.Accept)
        runCurrent()
        assertEquals(count, h.transport.requests.size)
    }

    @Test fun readFailureKeepsCardAndRevocationRejectsLateMutation() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val task = task()
        val model = PreparationTaskViewModel(h.repository, h.repository.open(h.id), backgroundScope)
        val path = "${h.path}/preparation-tasks/${task.id}"
        h.transport.enqueue(path, apiJson.encodeToString(task))
        model.load(task.id)
        h.transport.enqueue(path, "", 503)
        model.load(task.id)
        assertEquals(task, model.state.value.task)
        assertEquals(PreparationTaskIssue.Load, model.state.value.issue)
        val result = CompletableDeferred<WireResponse>()
        h.transport.handle("$path/accept") { result.await() }
        model.act(PreparationAction.Accept)
        runCurrent()
        h.session.updateAccess(h.id, false)
        result.complete(
            WireResponse(
                200,
                "application/json",
                apiJson.encodeToString(task.copy(state = "accepted")),
            ),
        )
        runCurrent()
        assertEquals("offered", model.state.value.task?.state)
        model.stop()
        assertNull(model.state.value.task)
        assertNull(model.state.value.pending)
    }

    @Test fun creationValidatesDraftAndEncodesGeneralRecipientExplicitly() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val model = PreparationFormViewModel(h.repository, h.repository.open(h.id), backgroundScope)
        h.transport.enqueue("${h.path}/participants", "{\"participants\":[]}")
        model.loadPeople()
        model.create()
        runCurrent()
        assertEquals(PreparationFormIssue.Title, model.state.value.validation)
        model.title("Заказать пиццу")
        model.recipient(UUID.randomUUID())
        model.create()
        assertEquals(PreparationFormIssue.Recipient, model.state.value.validation)
        assertTrue(h.transport.requests.none { it.method == "POST" })
        val create = PreparationTaskRequests.create(h.id, "Заказать пиццу", null)
        val body = apiJson.parseToJsonElement(checkNotNull(create.body)).jsonObject
        assertEquals(JsonNull, body["recipient_id"])
        assertEquals(h.id, create.meetingId)
        assertEquals(201, create.expectedStatus)
    }

    @Test fun peopleRetryKeepsDraftAndWrongTaskReplyIsNotApplied() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val form = PreparationFormViewModel(h.repository, h.repository.open(h.id), backgroundScope)
        form.title("Заказать пиццу")
        h.transport.enqueue("${h.path}/participants", "", 503)
        form.loadPeople()
        assertTrue(form.state.value.peopleError)
        assertEquals("Заказать пиццу", form.state.value.title)
        h.transport.enqueue("${h.path}/participants", "{\"participants\":[]}")
        form.loadPeople()
        assertFalse(form.state.value.peopleError)
        val model = form.operation
        val task = task()
        val path = "${h.path}/preparation-tasks/${task.id}"
        h.transport.enqueue(path, apiJson.encodeToString(task))
        model.load(task.id)
        h.transport.enqueue(
            "$path/accept",
            apiJson.encodeToString(task.copy(id = UUID.randomUUID())),
        )
        model.act(PreparationAction.Accept)
        runCurrent()
        assertEquals(task, model.state.value.task)
        assertNotNull(model.state.value.pending)
    }
}
