@file:OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)

package dev.groupplanning.android.feed

import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.RsvpAnswer
import dev.groupplanning.android.data.outbox.DeliveryStatus
import dev.groupplanning.android.data.outbox.PendingMessage
import dev.groupplanning.android.state.feed.FeedState
import dev.groupplanning.android.state.feed.FeedSync
import dev.groupplanning.android.state.feed.MessageSender
import dev.groupplanning.android.support.Fixtures
import java.util.UUID
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.encodeToString
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class ChatRestoreOutageTests {
    @Test fun freshMeetingAccessRestoresQueueAndDraftDespiteFeedOutage() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val access = h.repository.open(h.id)
        val pending = PendingMessage(
            UUID.randomUUID(),
            "Неотправленное сообщение",
            Fixtures.expiry,
            status = DeliveryStatus.Uncertain,
        )
        h.repository.update(access) { it.copy(draft = "Новый черновик", queue = listOf(pending)) }
        h.transport.enqueue(
            h.path,
            apiJson.encodeToString(Fixtures.meeting()),
        )
        h.transport.enqueue("${h.path}/feed", "", 503)
        val state = MutableStateFlow(FeedState())
        val sender = MessageSender(h.repository, backgroundScope) {}
        val sync = FeedSync(h.repository, state, sender, jitter = { it }) { _, _, _ -> }
        backgroundScope.launch { sync.run(access) }
        runCurrent()
        assertTrue(state.value.loadError)
        assertTrue(
            "Verified local state must not wait for a successful feed response",
            sender.state.value.ready,
        )
        assertEquals(pending, sender.state.value.pending)
        assertEquals("Новый черновик", sender.state.value.draft)
        assertTrue(h.transport.requests.any { it.url.encodedPath == "/api/v1/${h.path}" })
        assertEquals(0, h.transport.requests.count { it.method == "POST" })
        sender.retry()
        runCurrent()
        assertEquals(
            "Canonical outage must prevent POST even after explicit retry",
            0,
            h.transport.requests.count { it.method == "POST" },
        )
        h.page()
        h.transport.enqueue(
            "${h.path}/messages",
            apiJson.encodeToString(h.entry(1, pending.key, pending.text)),
            201,
        )
        sync.refresh()
        runCurrent()
        val request = h.transport.requests.single { it.method == "POST" }
        assertEquals(pending.key.toString(), request.header("Idempotency-Key"))
        assertNull(sender.state.value.pending)
        assertEquals("Новый черновик", sender.state.value.draft)
    }

    @Test fun liveSessionWithRevokedMeetingDoesNotExposePrivateQueue() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val access = h.repository.open(h.id)
        h.repository.update(access) {
            it.copy(
                draft = "Закрытый черновик",
                queue = listOf(
                    PendingMessage(
                        UUID.randomUUID(),
                        "Закрытая очередь",
                        Fixtures.expiry,
                        status = DeliveryStatus.Uncertain,
                    ),
                ),
            )
        }
        h.transport.enqueue(h.path, "", 403)
        h.transport.enqueue("${h.path}/feed", "", 503)
        val sender = MessageSender(h.repository, backgroundScope) {}
        val sync =
            FeedSync(h.repository, MutableStateFlow(FeedState()), sender, jitter = {
                it
            }) { _, _, _ -> }
        backgroundScope.launch { sync.run(access) }
        runCurrent()
        assertFalse(sender.state.value.ready)
        assertTrue(sender.state.value.queue.isEmpty())
        assertEquals("", sender.state.value.draft)
        assertTrue(h.id in h.session.state.value.data.denied)
        assertTrue(h.disk.load().isEmpty())
        assertEquals(0, h.transport.requests.count { it.method == "POST" })
    }

    @Test fun failedSessionVerificationDoesNotExposePrivateQueue() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val access = h.repository.open(h.id)
        h.repository.update(access) { it.copy(draft = "Закрытый черновик") }
        h.session.verify(access)
        h.transport.enqueue("me", "", 503)
        val sender = MessageSender(h.repository, backgroundScope) {}
        val sync =
            FeedSync(h.repository, MutableStateFlow(FeedState()), sender, jitter = {
                it
            }) { _, _, _ -> }
        backgroundScope.launch { sync.run(access) }
        runCurrent()
        assertFalse(sender.state.value.ready)
        assertTrue(sender.state.value.queue.isEmpty())
        assertEquals("", sender.state.value.draft)
        assertEquals("Закрытый черновик", h.disk.load().single().draft)
        assertEquals(0, h.transport.requests.count { it.method == "POST" })
    }

    @Test fun freshNonGoingMemberResponseCannotUnlockCachedDraft() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val access = h.repository.open(h.id)
        h.repository.update(access) { it.copy(draft = "Приватный черновик") }
        val revoked = Fixtures.meeting().copy(
            organizerId = UUID.randomUUID(),
            myRsvp = RsvpAnswer.NotGoing,
        )
        h.transport.enqueue(h.path, apiJson.encodeToString(revoked))
        val sender = MessageSender(h.repository, backgroundScope) {}
        val sync =
            FeedSync(h.repository, MutableStateFlow(FeedState()), sender, jitter = {
                it
            }) { _, _, _ -> }
        backgroundScope.launch { sync.run(access) }
        runCurrent()
        assertFalse(sender.state.value.ready)
        assertEquals("", sender.state.value.draft)
        assertTrue(h.id in h.session.state.value.data.denied)
        assertTrue(h.disk.load().isEmpty())
        assertEquals(0, h.transport.requests.count { it.method == "POST" })
    }
}
