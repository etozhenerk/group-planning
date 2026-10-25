package dev.groupplanning.android.session

import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.WireResponse
import dev.groupplanning.android.data.session.SessionRepository
import dev.groupplanning.android.data.session.SessionState
import dev.groupplanning.android.support.SessionHarness
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.cancelAndJoin
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

internal class AccountDeletionTests {
    @Test fun cancellationKeepsReceiptAndRetryableState() = runTest {
        val harness = SessionHarness(StandardTestDispatcher(testScheduler))
        harness.login()
        val entered = CompletableDeferred<Unit>()
        val response = CompletableDeferred<WireResponse>()
        harness.transport.handle("me") {
            entered.complete(Unit)
            response.await()
        }
        val request = launch { harness.session.deleteAccount() }
        entered.await()
        val pending = harness.storage.credential?.deletion
        request.cancelAndJoin()
        val state = harness.session.state.value.session as SessionState.Deleting
        assertFalse(state.busy)
        assertNotNull(pending)
        harness.transport.enqueue("me", status = 204)
        harness.session.deleteAccount()
        assertEquals(pending?.token, harness.transport.requests.last().header("X-Deletion-Token"))
        assertEquals(SessionState.Deleted, harness.session.state.value.session)
    }

    @Test fun completionClearsCredentialAndConfirmsSuccess() = runTest {
        val harness = SessionHarness(StandardTestDispatcher(testScheduler))
        harness.login()
        harness.transport.enqueue("me", status = 204)
        var cleaned = false
        harness.session.deleteAccount { cleaned = true }
        assertTrue(cleaned)
        assertNull(harness.storage.credential)
        assertEquals(SessionState.Deleted, harness.session.state.value.session)
        assertEquals("DELETE", harness.transport.requests.last().method)
        assertEquals(43, harness.transport.requests.last().header("X-Deletion-Token")?.length)
    }

    @Test fun lostResponseRestoresSameDeletionWithoutReadingSession() = runTest {
        val dispatcher = StandardTestDispatcher(testScheduler)
        val harness = SessionHarness(dispatcher)
        harness.login()
        harness.transport.enqueue("me", status = 503)
        try {
            harness.session.deleteAccount()
        } catch (_: ClientFailure) { }
        val pending = harness.storage.credential?.deletion
        assertNotNull(pending)
        val restored = SessionRepository(harness.session.api, harness.storage, dispatcher)
        val before = harness.transport.requests.size
        restored.restore()
        assertTrue(restored.state.value.session is SessionState.Deleting)
        assertEquals(before, harness.transport.requests.size)
        harness.transport.enqueue("me", status = 204)
        restored.deleteAccount()
        assertEquals(SessionState.Deleted, restored.state.value.session)
        assertEquals(pending?.token, harness.transport.requests.last().header("X-Deletion-Token"))
    }

    @Test fun unauthorizedDoesNotMeanDeleted() = runTest {
        val harness = SessionHarness(StandardTestDispatcher(testScheduler))
        harness.login()
        harness.transport.enqueue("me", status = 401)
        var cleaned = false
        try {
            harness.session.deleteAccount { cleaned = true }
        } catch (_: ClientFailure) { }
        assertFalse(cleaned)
        val state = harness.session.state.value.session as SessionState.Deleting
        assertEquals(401, state.error?.status)
        assertNotNull(harness.storage.credential?.deletion)
    }
}
