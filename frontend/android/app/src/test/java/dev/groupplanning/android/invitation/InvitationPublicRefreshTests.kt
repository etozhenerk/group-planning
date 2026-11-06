package dev.groupplanning.android.invitation

import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.ApiErrorEnvelope
import dev.groupplanning.android.data.api.models.ApiProblem
import dev.groupplanning.android.data.api.models.RsvpAnswer
import dev.groupplanning.android.data.api.models.ServerCounter
import dev.groupplanning.android.data.links.InvitationTarget
import java.util.UUID
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.encodeToString
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test

@OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)
class InvitationPublicRefreshTests {
    @Test fun meetingWithdrawalRefreshesKnownPublicLinkWithoutPrivateErrorSnapshot() = runTest {
        val h = InvitationHarness(StandardTestDispatcher(testScheduler))
        h.login()
        h.transport.enqueue("meetings/${h.id}", forbidden(), 403)
        h.transport.enqueue(
            "invitations/${h.token}",
            apiJson.encodeToString(h.preview(RsvpAnswer.NotGoing, "3")),
        )
        val before = h.transport.requests.size
        val target = InvitationTarget.Meeting(h.id, h.token)
        val result = h.repository.load(target, h.preview(RsvpAnswer.Going, "2"))

        assertEquals(RsvpAnswer.NotGoing, result.preview.myRsvp)
        assertEquals(ServerCounter("3"), result.preview.myRsvpRevision)
        assertFalse(result.canAccess)
        assertTrue(h.id in h.session.state.value.data.denied)
        assertFalse(h.id in h.session.state.value.data.details)
        assertEquals(before + 2, h.transport.requests.size)
        assertFalse(target.toString().contains(h.token))
    }

    @Test fun meetingWithdrawalWithoutFreshPublicSourceDoesNotReturnCachedGoing() = runTest {
        val h = InvitationHarness(StandardTestDispatcher(testScheduler))
        h.login()
        h.transport.enqueue("meetings/${h.id}", forbidden(), 403)
        val before = h.transport.requests.size
        try {
            h.repository.load(InvitationTarget.Meeting(h.id), h.preview(RsvpAnswer.Going, "2"))
            fail("A cached response cannot establish the current answer after denial")
        } catch (error: ClientFailure) {
            assertEquals(403, error.status)
        }
        assertTrue(h.id in h.session.state.value.data.denied)
        assertEquals(before + 1, h.transport.requests.size)
    }

    private fun forbidden(): String = apiJson.encodeToString(
        ApiErrorEnvelope(ApiProblem("forbidden", emptyMap(), UUID.randomUUID())),
    )
}
