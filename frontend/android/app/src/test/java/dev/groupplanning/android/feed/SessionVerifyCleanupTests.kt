@file:OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)

package dev.groupplanning.android.feed

import dev.groupplanning.android.data.api.WireResponse
import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.CurrentSession
import dev.groupplanning.android.data.session.SessionState
import dev.groupplanning.android.state.feed.FeedViewModel
import dev.groupplanning.android.support.Fixtures
import java.util.UUID
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.encodeToString
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SessionVerifyCleanupTests {
    @Test fun changedActorDuringFreshVerificationClearsPreviousOwnerDisk() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val access = h.repository.open(h.id)
        h.repository.update(access) { it.copy(draft = "previous owner private draft") }
        h.session.verify(access)
        h.transport.enqueue(
            "me",
            apiJson.encodeToString(
                CurrentSession(
                    Fixtures.user.copy(id = UUID.randomUUID()),
                    Fixtures.expiry,
                ),
            ),
        )
        val vm = FeedViewModel(h.id, h.repository, backgroundScope)
        backgroundScope.launch { vm.runActive() }
        runCurrent()
        assertFalse(h.session.state.value.session is SessionState.Authenticated)
        assertFalse(vm.sender.state.value.ready)
        assertEquals("", vm.sender.state.value.draft)
        assertTrue(h.disk.load().isEmpty())
        assertEquals(0, h.transport.requests.count { it.method == "POST" })
        vm.stop()
    }

    @Test fun cancellationDuringNetworkVerificationStillPropagates() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val access = h.repository.open(h.id)
        h.repository.update(access) { it.copy(draft = "owner draft") }
        h.session.verify(access)
        val release = CompletableDeferred<Unit>()
        var entered = false
        var returned = false
        h.transport.handle("me") {
            entered = true
            release.await()
            WireResponse(
                200,
                "application/json",
                apiJson.encodeToString(
                    CurrentSession(
                        Fixtures.user,
                        Fixtures.expiry,
                    ),
                ),
            )
        }
        val verifying = backgroundScope.launch {
            h.session.verify(access)
            returned = true
        }
        runCurrent()
        assertTrue(entered)
        verifying.cancel()
        runCurrent()
        assertTrue(verifying.isCancelled)
        assertFalse(returned)
        assertTrue(h.session.state.value.session is SessionState.Authenticated)
        assertEquals("owner draft", h.disk.load().single().draft)
        assertEquals(0, h.transport.requests.count { it.method == "POST" })
    }
}
