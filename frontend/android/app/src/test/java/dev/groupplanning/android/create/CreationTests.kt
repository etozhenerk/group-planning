package dev.groupplanning.android.create

import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.CreatedMeeting
import dev.groupplanning.android.data.api.models.PreparedCover
import dev.groupplanning.android.data.drafts.CoverDraft
import dev.groupplanning.android.data.session.SessionState
import dev.groupplanning.android.support.Fixtures
import kotlinx.coroutines.test.advanceTimeBy
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

@OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)
class CreationTests {
    @Test fun calendarDateReplacesOnlyDraftDateAndDoesNotRewritePendingRequest() = runTest {
        val h = CreationHarness(this)
        h.api.login()
        val first = h.model()
        first.load()
        runCurrent()
        first.change { it.copy(title = "Настолки", day = "2026-10-24", time = "19:00") }
        first.saveAndClose()
        runCurrent()
        first.stop()
        val next = h.model(java.time.LocalDate.parse("2026-10-31"))
        next.load()
        runCurrent()
        assertEquals("2026-10-31", next.state.value.record.value.day)
        assertEquals("Настолки", next.state.value.record.value.title)
        assertEquals("19:00", next.state.value.record.value.time)
        assertEquals("Europe/Moscow", next.state.value.record.value.timezone)
        h.api.transport.enqueue("meetings", status = 503)
        next.submit()
        runCurrent()
        val pending = next.state.value.record
        next.stop()
        val retry = h.model(java.time.LocalDate.parse("2026-11-07"))
        retry.load()
        runCurrent()
        assertEquals(pending, retry.state.value.record)
    }

    @Test fun closeAndReopenRestoresDraft() = runTest {
        val h = CreationHarness(this)
        h.api.login()
        val first = h.model()
        first.load()
        runCurrent()
        first.change { it.copy(title = "Настолки", place = "У Саши") }
        first.saveAndClose()
        runCurrent()
        assertTrue(first.state.value.closed)
        first.stop()
        val next = h.model()
        next.load()
        runCurrent()
        assertEquals("Настолки", next.state.value.record.value.title)
        assertEquals("У Саши", next.state.value.record.value.place)
        assertEquals("Europe/Moscow", next.state.value.record.value.timezone)
    }

    @Test fun lostResponseSurvivesRecreationWithSamePayloadAndKey() = runTest {
        val h = CreationHarness(this)
        h.api.login()
        val first = h.model()
        first.load()
        runCurrent()
        first.change {
            it.copy(
                title = "Настолки",
                day = "2026-10-24",
                time = "19:00",
                cover = CoverDraft(PreparedCover("image/jpeg", "Y292ZXI=")),
            )
        }
        h.api.transport.enqueue("meetings", status = 503)
        first.submit()
        first.submit()
        runCurrent()
        assertTrue(first.state.value.frozen)
        first.change { it.copy(title = "Should not change") }
        assertEquals("Настолки", first.state.value.record.value.title)
        first.stop()
        val next = h.model()
        next.load()
        runCurrent()
        assertTrue(next.state.value.frozen)
        val result = CreatedMeeting(Fixtures.meeting(), "organizer", "https://example.test/i/token")
        h.api.transport.enqueue("meetings", apiJson.encodeToString(result), status = 201)
        next.submit()
        runCurrent()
        assertNotNull(next.state.value.created)
        assertNull(h.storage.record)
        val requests = h.api.transport.requests.filter { it.method == "POST" }
        assertEquals(2, requests.size)
        assertEquals(requests[0].header("Idempotency-Key"), requests[1].header("Idempotency-Key"))
        val bodies = requests.map { request ->
            Buffer().also { request.body?.writeTo(it) }.readUtf8()
        }
        assertEquals(bodies[0], bodies[1])
    }

    @Test fun storageFailurePreventsNetworkAndLeavesEditableFields() = runTest {
        val h = CreationHarness(this)
        h.api.login()
        val model = h.model()
        model.load()
        runCurrent()
        model.change { it.copy(title = "Настолки", day = "2026-10-24", time = "19:00") }
        h.storage.fail = true
        model.submit()
        runCurrent()
        assertEquals(0, h.api.transport.requests.count { it.method == "POST" })
        assertTrue(model.state.value.editable)
        assertNotNull(model.state.value.problem)
        model.saveAndClose()
        runCurrent()
        assertFalse(model.state.value.closed)
    }

    @Test fun validationNeverSendsAndDefiniteServerFailureAllowsCorrection() = runTest {
        val h = CreationHarness(this)
        h.api.login()
        val model = h.model()
        model.load()
        runCurrent()
        model.submit()
        runCurrent()
        assertNotNull(model.state.value.problem)
        assertEquals(0, h.api.transport.requests.count { it.method == "POST" })
        model.change { it.copy(title = "Настолки", day = "2026-10-24", time = "19:00") }
        h.api.transport.enqueue("meetings", status = 422)
        model.submit()
        runCurrent()
        assertTrue(model.state.value.editable)
        val old = model.state.value.record.requestId
        model.change { it.copy(title = "Другое название") }
        assertFalse(old == model.state.value.record.requestId)
        advanceTimeBy(200)
        runCurrent()
        assertNull(h.storage.record?.submission)
    }

    @Test fun expiredSessionDoesNotRevealCreatedMeeting() = runTest {
        val h = CreationHarness(this)
        h.api.login()
        val model = h.model()
        model.load()
        runCurrent()
        model.change { it.copy(title = "Настолки", day = "2026-10-24", time = "19:00") }
        h.api.transport.enqueue("meetings", status = 401)
        model.submit()
        runCurrent()
        assertNull(model.state.value.created)
        assertNull(h.api.storage.credential)
        assertFalse(
            h.api.session.state.value.session is SessionState.Authenticated,
        )
    }
}
