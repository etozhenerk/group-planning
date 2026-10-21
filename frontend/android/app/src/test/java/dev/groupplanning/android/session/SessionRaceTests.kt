package dev.groupplanning.android.session

import dev.groupplanning.android.data.api.WireResponse
import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.CurrentSession
import dev.groupplanning.android.data.api.models.MeetingsPage
import dev.groupplanning.android.data.session.SessionState
import dev.groupplanning.android.data.session.StoredSession
import dev.groupplanning.android.support.Fixtures
import dev.groupplanning.android.support.SessionHarness
import dev.groupplanning.android.support.seed
import java.util.UUID
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class SessionRaceTests {
    @Test fun forbiddenReadClearsOnlyItsMeetingAndCancelsLateDetail() = runTest {
        val h = SessionHarness(StandardTestDispatcher(testScheduler))
        h.login()
        h.seed()
        val other = UUID.randomUUID()
        h.seed(other)
        val started = CompletableDeferred<Unit>()
        val gate = CompletableDeferred<Unit>()
        h.transport.handle("meetings/${Fixtures.meetingId}") {
            started.complete(Unit)
            withContext(NonCancellable) { gate.await() }
            WireResponse(200, "application/json", apiJson.encodeToString(Fixtures.meeting()))
        }
        val late = launch { h.meetings.loadMeeting(Fixtures.meetingId) }
        started.await()
        h.transport.enqueue("meetings/${Fixtures.meetingId}/feed", status = 403)
        h.meetings.loadFeed(Fixtures.meetingId)
        gate.complete(Unit)
        late.join()
        assertTrue(late.isCancelled)
        val state = h.session.state.value
        assertTrue(state.session is SessionState.Authenticated)
        assertFalse(state.data.details.containsKey(Fixtures.meetingId))
        assertFalse(state.data.feeds.containsKey(Fixtures.meetingId))
        assertFalse(state.data.participants.containsKey(Fixtures.meetingId))
        assertTrue(state.data.details.containsKey(other))
        assertTrue(h.storage.credential != null)
    }

    @Test fun oldRestoreCannotEraseNewSession() = runTest {
        val h = SessionHarness(StandardTestDispatcher(testScheduler))
        val started = CompletableDeferred<Unit>()
        val gate = CompletableDeferred<Unit>()
        h.transport.handle("me") {
            started.complete(Unit)
            withContext(NonCancellable) { gate.await() }
            WireResponse(401, "text/plain", "old failure")
        }
        val old = launch { h.session.restore() }
        started.await()
        val user = Fixtures.user.copy(displayName = "Саша")
        h.transport.enqueue("me", apiJson.encodeToString(CurrentSession(user, Fixtures.expiry)))
        h.session.restore(StoredSession("new-secret", Fixtures.expiry))
        gate.complete(Unit)
        old.join()
        assertEquals("new-secret", h.storage.credential?.token)
        assertEquals(user, (h.session.state.value.session as SessionState.Authenticated).profile)
    }

    @Test fun logoutCannotBeUndoneByLateListResponse() = runTest {
        val h = SessionHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val started = CompletableDeferred<Unit>()
        val gate = CompletableDeferred<Unit>()
        h.transport.handle("meetings") {
            started.complete(Unit)
            withContext(NonCancellable) { gate.await() }
            WireResponse(
                200,
                "application/json",
                apiJson.encodeToString(MeetingsPage(listOf(Fixtures.summary()), null)),
            )
        }
        val old = launch { h.meetings.loadMeetings() }
        started.await()
        h.transport.enqueue("auth/logout", status = 204)
        h.session.logout()
        gate.complete(Unit)
        old.join()
        assertNull(h.session.state.value.data.meetings.value)
        assertNull(h.storage.credential)
    }

    @Test fun cancelledRestoreDoesNotAuthenticateLater() = runTest {
        val h = SessionHarness(StandardTestDispatcher(testScheduler))
        val started = CompletableDeferred<Unit>()
        val gate = CompletableDeferred<Unit>()
        h.transport.handle("me") {
            started.complete(Unit)
            withContext(NonCancellable) { gate.await() }
            WireResponse(
                200,
                "application/json",
                apiJson.encodeToString(CurrentSession(Fixtures.user, Fixtures.expiry)),
            )
        }
        val task = launch { h.session.restore() }
        started.await()
        task.cancel()
        gate.complete(Unit)
        task.join()
        assertEquals(SessionState.SignedOut, h.session.state.value.session)
    }

    @Test fun revokedMeetingCannotReturnThroughPendingList() = runTest {
        val h = SessionHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val started = CompletableDeferred<Unit>()
        val gate = CompletableDeferred<Unit>()
        h.transport.handle("meetings") {
            started.complete(Unit)
            gate.await()
            WireResponse(
                200,
                "application/json",
                apiJson.encodeToString(MeetingsPage(listOf(Fixtures.summary()), null)),
            )
        }
        val list = launch { h.meetings.loadMeetings() }
        started.await()
        h.session.updateAccess(Fixtures.meetingId, allowed = false)
        gate.complete(Unit)
        list.join()
        assertTrue(checkNotNull(h.session.state.value.data.meetings.value).meetings.isEmpty())
    }
}
