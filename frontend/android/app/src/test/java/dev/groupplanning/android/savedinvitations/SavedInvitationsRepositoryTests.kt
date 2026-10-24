package dev.groupplanning.android.savedinvitations

import dev.groupplanning.android.data.api.WireResponse
import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.InvitationsPage
import dev.groupplanning.android.data.api.models.RsvpAnswer
import dev.groupplanning.android.data.repository.SavedInvitationsRepository
import dev.groupplanning.android.support.Fixtures
import dev.groupplanning.android.support.SessionHarness
import java.util.UUID
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.cancelAndJoin
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.encodeToString
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class SavedInvitationsRepositoryTests {
    private val sample = apiJson.decodeFromString<InvitationsPage>(
        Fixtures.json("saved-invitations"),
    )

    @Test fun paginationDeduplicatesAndRefreshRetainsLoadedPages() = runTest {
        val h = SessionHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val repository = SavedInvitationsRepository(h.session)
        val first = sample.invitations.first()
        val second = first.copy(preview = first.preview.copy(meetingId = UUID.randomUUID()))
        h.transport.enqueue(
            "invitations",
            apiJson.encodeToString(sample.copy(invitations = listOf(first), nextCursor = "next")),
        )
        repository.load()
        h.transport.enqueue(
            "invitations",
            apiJson.encodeToString(
                sample.copy(invitations = listOf(first, second), nextCursor = null),
            ),
        )
        repository.load(true)
        assertEquals(
            listOf(first, second),
            h.session.state.value.data.invitations.page?.invitations,
        )
        h.transport.enqueue(
            "invitations",
            apiJson.encodeToString(sample.copy(invitations = listOf(second), nextCursor = "fresh")),
        )
        h.transport.enqueue(
            "invitations",
            apiJson.encodeToString(sample.copy(invitations = listOf(first), nextCursor = null)),
        )
        repository.load()
        assertEquals(
            listOf(second, first),
            h.session.state.value.data.invitations.page?.invitations,
        )
        assertEquals("fresh", h.transport.requests.last().url.queryParameter("cursor"))
    }

    @Test fun failureKeepsCardsAndConfirmedRefreshRemovesThem() = runTest {
        val h = SessionHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val repository = SavedInvitationsRepository(h.session)
        h.transport.enqueue("invitations", apiJson.encodeToString(sample))
        repository.load()
        h.transport.enqueue("invitations", status = 503)
        repository.load()
        assertEquals(sample, h.session.state.value.data.invitations.page)
        assertNotNull(h.session.state.value.data.invitations.error)
        h.transport.enqueue(
            "invitations",
            apiJson.encodeToString(sample.copy(invitations = emptyList(), nextCursor = null)),
        )
        repository.load()
        assertTrue(checkNotNull(h.session.state.value.data.invitations.page).invitations.isEmpty())
        assertNull(h.session.state.value.data.invitations.error)
    }

    @Test fun cancellationAllowsRetryAndLogoutRejectsLateData() = runTest {
        val h = SessionHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val repository = SavedInvitationsRepository(h.session)
        val started = CompletableDeferred<Unit>()
        h.transport.handle("invitations") {
            started.complete(Unit)
            CompletableDeferred<WireResponse>().await()
        }
        val pending = launch { repository.load() }
        started.await()
        pending.cancelAndJoin()
        assertNull(h.session.state.value.data.invitations.request)
        val gate = CompletableDeferred<Unit>()
        val lateStarted = CompletableDeferred<Unit>()
        h.transport.handle("invitations") {
            lateStarted.complete(Unit)
            gate.await()
            WireResponse(200, "application/json", apiJson.encodeToString(sample))
        }
        val old = launch { repository.load() }
        lateStarted.await()
        h.transport.enqueue("auth/logout", status = 204)
        h.session.logout()
        gate.complete(Unit)
        old.join()
        assertNull(h.session.state.value.data.invitations.page)
    }

    @Test fun unexpectedAnswerIsRejected() = runTest {
        val h = SessionHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val repository = SavedInvitationsRepository(h.session)
        val invalid = sample.copy(
            invitations = sample.invitations.map {
                it.copy(preview = it.preview.copy(myRsvp = RsvpAnswer.Going))
            },
        )
        h.transport.enqueue("invitations", apiJson.encodeToString(invalid))
        repository.load()
        assertNull(h.session.state.value.data.invitations.page)
        assertNotNull(h.session.state.value.data.invitations.error)
    }
}
