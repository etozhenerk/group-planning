package dev.groupplanning.android.invitation

import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.ApiInstant
import dev.groupplanning.android.data.api.models.Participants
import dev.groupplanning.android.data.api.models.RsvpAnswer
import dev.groupplanning.android.data.outbox.MessageOutbox
import dev.groupplanning.android.data.repository.FeedRepository
import dev.groupplanning.android.feed.MemoryMessages
import dev.groupplanning.android.state.InvitationIssue
import dev.groupplanning.android.state.InvitationViewModel
import dev.groupplanning.android.support.Fixtures
import java.util.UUID
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.encodeToString
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotSame
import org.junit.Assert.assertTrue
import org.junit.Test

@OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)
class InvitationRefreshTests {
    @Test fun backgroundDetailsCannotReopenDeniedChatButExplicitReloadCanRecover() = runTest {
        val dispatcher = StandardTestDispatcher(testScheduler)
        val h = InvitationHarness(dispatcher)
        h.login()
        authorizedDetails(h)
        val model = InvitationViewModel(
            h.target,
            h.repository,
            CoroutineScope(SupervisorJob() + dispatcher),
            feeds = FeedRepository(h.session, MessageOutbox(MemoryMessages(), dispatcher)),
        )
        try {
            runCurrent()
            assertTrue(checkNotNull(model.state.value.details).canAccess)
            val previousFeed = checkNotNull(model.conversation(h.id))
            h.session.updateAccess(h.id, false)
            runCurrent()
            val requestsBefore = h.transport.requests.size
            authorizedDetails(h, includeParticipants = false)

            repeat(3) {
                model.refreshIfIdle()
                runCurrent()
            }
            assertTrue(h.id in h.session.state.value.data.denied)
            assertEquals(requestsBefore + 2, h.transport.requests.size)
            assertEquals(InvitationIssue.Load, model.state.value.issue)

            authorizedDetails(h)
            model.reload()
            runCurrent()
            assertFalse(h.id in h.session.state.value.data.denied)
            assertTrue(checkNotNull(model.state.value.details).canAccess)
            assertNotSame(previousFeed, checkNotNull(model.conversation(h.id)))
        } finally {
            model.stop()
        }
    }

    @Test fun withdrawalRefreshesPublicAnswerOnceWithoutReopeningPrivateData() = runTest {
        val dispatcher = StandardTestDispatcher(testScheduler)
        val h = InvitationHarness(dispatcher)
        h.login()
        authorizedDetails(h)
        val model = InvitationViewModel(
            h.target,
            h.repository,
            CoroutineScope(SupervisorJob() + dispatcher),
            feeds = FeedRepository(h.session, MessageOutbox(MemoryMessages(), dispatcher)),
        )
        try {
            runCurrent()
            model.conversation(h.id)
            h.session.updateAccess(h.id, false)
            h.transport.handle("invitations/${h.token}") { awaitCancellation() }
            model.refreshIfIdle()
            runCurrent()
            model.suspend()
            runCurrent()
            val boundary = java.time.Instant.now().plusSeconds(60)
            h.transport.enqueue(
                "invitations/${h.token}",
                apiJson.encodeToString(
                    h.preview(RsvpAnswer.NotGoing, "2").copy(
                        joinClosesAt = ApiInstant(boundary.toString()),
                        canJoin = true,
                    ),
                ),
            )
            h.transport.enqueue("meetings/${h.id}", h.denied(RsvpAnswer.NotGoing, "2"), 403)
            val requestsBefore = h.transport.requests.size
            repeat(3) {
                model.refreshIfIdle()
                runCurrent()
            }
            assertTrue(h.id in h.session.state.value.data.denied)
            assertEquals(RsvpAnswer.NotGoing, model.state.value.answer)
            assertEquals(RsvpAnswer.NotGoing, model.state.value.choice)
            assertEquals(requestsBefore + 2, h.transport.requests.size)
            assertFalse(checkNotNull(model.state.value.details).canAccess)
            assertFalse(model.state.value.joinClosed)
            model.refreshDeadline(boundary)
            assertTrue(model.state.value.joinClosed)
            assertEquals(RsvpAnswer.NotGoing, model.state.value.choice)
            assertEquals(requestsBefore + 2, h.transport.requests.size)
            model.refreshDeadline(boundary.minusMillis(1))
            assertFalse(model.state.value.joinClosed)
            h.loadDenied(RsvpAnswer.NotGoing, "2")
            model.refreshIfIdle(foreground = true)
            runCurrent()
            assertEquals(requestsBefore + 4, h.transport.requests.size)
            assertTrue(h.id in h.session.state.value.data.denied)
            assertFalse(checkNotNull(model.state.value.details).canAccess)
        } finally {
            model.stop()
        }
    }

    private fun authorizedDetails(h: InvitationHarness, includeParticipants: Boolean = true) {
        h.transport.enqueue(
            "invitations/${h.token}",
            apiJson.encodeToString(h.preview(RsvpAnswer.Going, "1")),
        )
        h.transport.enqueue(
            "meetings/${h.id}",
            apiJson.encodeToString(Fixtures.meeting().copy(organizerId = UUID.randomUUID())),
        )
        if (includeParticipants) {
            h.transport.enqueue(
                "meetings/${h.id}/participants",
                apiJson.encodeToString(Participants(emptyList())),
            )
        }
    }
}
