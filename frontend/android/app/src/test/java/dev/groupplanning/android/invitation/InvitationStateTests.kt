package dev.groupplanning.android.invitation

import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.MeetingsPage
import dev.groupplanning.android.data.api.models.RsvpAnswer
import dev.groupplanning.android.data.api.models.RsvpRequest
import dev.groupplanning.android.data.api.models.RsvpResult
import dev.groupplanning.android.data.api.models.ServerCounter
import dev.groupplanning.android.data.repository.ResourcePhase
import dev.groupplanning.android.data.repository.ResourceState
import dev.groupplanning.android.state.InvitationIssue
import dev.groupplanning.android.state.InvitationViewModel
import dev.groupplanning.android.support.Fixtures
import java.util.UUID
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.encodeToString
import okio.Buffer
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

@OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)
class InvitationStateTests {
    @Test fun anonymousPreviewNeverReadsPrivateDataOrSavesResponse() = runTest {
        val h = InvitationHarness(StandardTestDispatcher(testScheduler))
        h.transport.enqueue("invitations/${h.token}", apiJson.encodeToString(h.preview()))
        val value = h.repository.load(h.target, null)
        assertFalse(value.canAccess)
        assertEquals(1, h.transport.requests.size)
        assertNull(h.transport.requests.single().header("Authorization"))
    }

    @Test fun unknownOutcomeRetriesSameKeyAndRevisionWithoutChangingConfirmedAnswer() = runTest {
        val dispatcher = StandardTestDispatcher(testScheduler)
        val h = InvitationHarness(dispatcher)
        h.login()
        h.loadDenied()
        val model = InvitationViewModel(
            h.target,
            h.repository,
            CoroutineScope(
                SupervisorJob() + dispatcher,
            ),
        )
        try {
            runCurrent()
            model.choose(RsvpAnswer.Maybe)
            h.transport.enqueue("invitations/${h.token}/rsvp", status = 503)
            model.save()
            runCurrent()
            assertEquals(InvitationIssue.Unconfirmed, model.state.value.issue)
            assertNull(model.state.value.answer)
            val pending = checkNotNull(model.state.value.pending)
            h.transport.enqueue(
                "invitations/${h.token}/rsvp",
                apiJson.encodeToString(
                    RsvpResult(
                        h.id,
                        RsvpAnswer.Maybe,
                        ServerCounter("1"),
                        false,
                        ServerCounter("2"),
                    ),
                ),
            )
            h.transport.enqueue("meetings", apiJson.encodeToString(MeetingsPage(emptyList(), null)))
            model.save()
            runCurrent()
            assertEquals(RsvpAnswer.Maybe, model.state.value.answer)
            assertNull(model.state.value.pending)
            val writes = h.transport.requests.filter { it.method == "PUT" }
            assertEquals(2, writes.size)
            writes.forEach {
                assertEquals(pending.key.toString(), it.header("Idempotency-Key"))
                val body = Buffer().also { buffer ->
                    checkNotNull(it.body).writeTo(buffer)
                }.readUtf8()
                assertEquals(pending.input, apiJson.decodeFromString<RsvpRequest>(body))
            }
            assertFalse(checkNotNull(model.state.value.details).canAccess)
        } finally {
            model.stop()
        }
    }

    @Test fun conflictRefreshesServerAnswerWithoutOverwritingIt() = runTest {
        val dispatcher = StandardTestDispatcher(testScheduler)
        val h = InvitationHarness(dispatcher)
        h.login()
        h.loadDenied()
        val model = InvitationViewModel(
            h.target,
            h.repository,
            CoroutineScope(
                SupervisorJob() + dispatcher,
            ),
        )
        try {
            runCurrent()
            model.choose(RsvpAnswer.Going)
            h.transport.enqueue(
                "invitations/${h.token}/rsvp",
                h.denied(RsvpAnswer.NotGoing, "2", 409),
                409,
            )
            h.loadDenied(RsvpAnswer.NotGoing, "2")
            model.save()
            runCurrent()
            assertEquals(InvitationIssue.Conflict, model.state.value.issue)
            assertEquals(RsvpAnswer.NotGoing, model.state.value.answer)
            assertNull(model.state.value.pending)
            assertEquals(1, h.transport.requests.count { it.method == "PUT" })
        } finally {
            model.stop()
        }
    }

    @Test fun confirmedWithdrawalPurgesPrivateDataAndCanBeAcceptedAgain() = runTest {
        val h = InvitationHarness(StandardTestDispatcher(testScheduler))
        h.login()
        h.session.beginData {
            it.copy(
                details = mapOf(
                    h.id to ResourceState(ResourcePhase.Ready, Fixtures.meeting()),
                ),
            )
        }
        h.transport.enqueue(
            "invitations/${h.token}/rsvp",
            apiJson.encodeToString(
                RsvpResult(
                    h.id,
                    RsvpAnswer.NotGoing,
                    ServerCounter("2"),
                    false,
                    ServerCounter("3"),
                ),
            ),
        )
        h.repository.respond(
            h.target,
            h.id,
            RsvpRequest(RsvpAnswer.NotGoing, ServerCounter("1")),
            UUID.randomUUID(),
        )
        assertTrue(h.id in h.session.state.value.data.denied)
        assertTrue(h.session.state.value.data.details.isEmpty())
        h.transport.enqueue(
            "invitations/${h.token}/rsvp",
            apiJson.encodeToString(
                RsvpResult(
                    h.id,
                    RsvpAnswer.Going,
                    ServerCounter("3"),
                    true,
                    ServerCounter("4"),
                ),
            ),
        )
        h.repository.respond(
            h.target,
            h.id,
            RsvpRequest(RsvpAnswer.Going, ServerCounter("2")),
            UUID.randomUUID(),
        )
        assertFalse(h.id in h.session.state.value.data.denied)
    }

    @Test fun failedWithdrawalKeepsConfirmedChatAndStopsOnSessionLoss() = runTest {
        val dispatcher = StandardTestDispatcher(testScheduler)
        val h = InvitationHarness(dispatcher)
        h.login()
        h.transport.enqueue(
            "invitations/${h.token}",
            apiJson.encodeToString(h.preview(RsvpAnswer.Going, "1")),
        )
        h.transport.enqueue(
            "meetings/${h.id}",
            apiJson.encodeToString(Fixtures.meeting().copy(organizerId = UUID.randomUUID())),
        )
        h.transport.enqueue(
            "meetings/${h.id}/participants",
            apiJson.encodeToString(
                dev.groupplanning.android.data.api.models.Participants(emptyList()),
            ),
        )
        h.transport.enqueue(
            "meetings/${h.id}/feed",
            apiJson.encodeToString(
                dev.groupplanning.android.data.api.models.FeedPage(
                    emptyList(),
                    false,
                    ServerCounter("1"),
                    2,
                    RsvpAnswer.Going,
                    ServerCounter("1"),
                    ServerCounter("0"),
                ),
            ),
        )
        val model = InvitationViewModel(
            h.target,
            h.repository,
            CoroutineScope(
                SupervisorJob() + dispatcher,
            ),
        )
        try {
            runCurrent()
            assertTrue(checkNotNull(model.state.value.details).canAccess)
            model.choose(RsvpAnswer.Maybe)
            h.transport.enqueue("invitations/${h.token}/rsvp", status = 503)
            model.save()
            runCurrent()
            assertEquals(RsvpAnswer.Going, model.state.value.answer)
            assertTrue(checkNotNull(model.state.value.details).canAccess)
            assertFalse(h.id in h.session.state.value.data.denied)
            assertTrue(h.session.state.value.data.feeds.isNotEmpty())
            h.transport.enqueue("invitations/${h.token}/rsvp", status = 401)
            h.transport.enqueue("invitations/${h.token}", apiJson.encodeToString(h.preview()))
            model.save()
            runCurrent()
            assertNull(model.state.value.profileId)
            assertFalse(checkNotNull(model.state.value.details).canAccess)
            assertTrue(h.session.state.value.data.feeds.isEmpty())
        } finally {
            model.stop()
        }
    }

    @Test fun foregroundRefreshKeepsUnsavedChoiceButUsesCurrentServerAnswer() = runTest {
        val dispatcher = StandardTestDispatcher(testScheduler)
        val h = InvitationHarness(dispatcher)
        h.login()
        h.loadDenied(RsvpAnswer.Maybe, "1")
        val model = InvitationViewModel(
            h.target,
            h.repository,
            CoroutineScope(
                SupervisorJob() + dispatcher,
            ),
        )
        try {
            runCurrent()
            model.choose(RsvpAnswer.Going)
            h.loadDenied(RsvpAnswer.NotGoing, "2")
            model.refreshIfIdle()
            runCurrent()
            assertEquals(RsvpAnswer.Going, model.state.value.choice)
            assertEquals(RsvpAnswer.NotGoing, model.state.value.answer)
            assertEquals(ServerCounter("2"), model.state.value.details?.preview?.myRsvpRevision)
            assertFalse(checkNotNull(model.state.value.details).canAccess)
            assertTrue(h.transport.requests.none { it.method == "PUT" })
        } finally {
            model.stop()
        }
    }
}
