@file:OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)

package dev.groupplanning.android.feed

import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.outbox.MessageOutbox
import dev.groupplanning.android.data.repository.FeedRepository
import dev.groupplanning.android.state.feed.MessageSender
import dev.groupplanning.android.support.Fixtures
import java.util.UUID
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.encodeToString
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class MessageTests {
    @Test fun restoredIntentRetainsTextAndKeyAndOnlyExplicitRetryPosts() = runTest {
        val dispatcher = StandardTestDispatcher(testScheduler)
        val h = FeedHarness(dispatcher)
        h.login()
        val lease = h.repository.open(h.id)
        val first = MessageSender(h.repository, backgroundScope) {}
        first.open(lease)
        first.edit("Пиццу закажу я")
        runCurrent()
        h.transport.enqueue("${h.path}/messages", "", 503)
        first.send()
        runCurrent()
        val pending = checkNotNull(first.state.value.pending)
        first.edit("А напитки кто возьмёт?")
        runCurrent()
        first.suspend()
        val recreated =
            MessageSender(
                FeedRepository(h.session, MessageOutbox(h.disk, dispatcher)),
                backgroundScope,
            ) {
            }
        recreated.open(lease)
        assertEquals(pending, recreated.state.value.pending)
        assertEquals("А напитки кто возьмёт?", recreated.state.value.draft)
        assertEquals(1, h.transport.requests.count { it.method == "POST" })
        h.transport.enqueue(
            "${h.path}/messages",
            apiJson.encodeToString(h.entry(5, pending.key, pending.text)),
            201,
        )
        recreated.retry()
        runCurrent()
        val requests = h.transport.requests.filter { it.method == "POST" }
        assertEquals(2, requests.size)
        assertEquals(requests[0].header("Idempotency-Key"), requests[1].header("Idempotency-Key"))
        assertNull(recreated.state.value.pending)
        assertEquals("А напитки кто возьмёт?", h.outbox.read(Fixtures.userId, h.id).draft)
    }

    @Test fun pollingAcknowledgesOnlyOwnMatchingMessage() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val sender = MessageSender(h.repository, backgroundScope) {}
        sender.open(h.repository.open(h.id))
        sender.edit("Привет")
        runCurrent()
        h.transport.enqueue("${h.path}/messages", "", 503)
        sender.send()
        runCurrent()
        val pending = checkNotNull(sender.state.value.pending)
        sender.acknowledge(
            listOf(
                h.entry(1, pending.key).copy(actor = Fixtures.user.copy(id = UUID.randomUUID())),
            ),
        )
        assertEquals(pending, sender.state.value.pending)
        sender.acknowledge(listOf(h.entry(2, pending.key, pending.text)))
        assertNull(sender.state.value.pending)
        assertTrue(h.disk.load().isEmpty())
    }

    @Test fun deniedMeetingCannotReadOrWritePersistedDraftAndLogoutClearsEveryMeeting() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val lease = h.repository.open(h.id)
        h.repository.update(lease) { it.copy(draft = "Первый") }
        val other = h.repository.open(UUID.randomUUID())
        h.repository.update(other) { it.copy(draft = "Второй") }
        h.transport.enqueue("${h.path}/feed", "", 403)
        try {
            h.repository.page(lease)
            error("Expected denial")
        } catch (_: ClientFailure) { }
        assertEquals(1, h.disk.load().size)
        try {
            h.repository.update(lease) { it.copy(draft = "Поздний") }
            error("Expected denial")
        } catch (
            _: ClientFailure,
        ) { }
        h.transport.enqueue("auth/logout", "", 204)
        h.session.logout()
        assertTrue(h.disk.load().isEmpty())
    }

    @Test fun rejectedMessageRequiresEditingInsteadOfBlindRetry() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val sender = MessageSender(h.repository, backgroundScope) {}
        sender.open(h.repository.open(h.id))
        sender.edit("Текст")
        runCurrent()
        h.transport.enqueue("${h.path}/messages", "", 409)
        sender.send()
        runCurrent()
        assertTrue(checkNotNull(sender.state.value.pending).rejected)
        sender.retry()
        runCurrent()
        assertEquals(1, h.transport.requests.count { it.method == "POST" })
        sender.edit("я".repeat(4000))
        runCurrent()
        sender.recoverRejected()
        runCurrent()
        assertEquals("я".repeat(4000), sender.state.value.draft)
        assertEquals(1, sender.state.value.queue.size)
        sender.edit("")
        runCurrent()
        sender.recoverRejected()
        runCurrent()
        assertEquals("Текст", sender.state.value.draft)
        assertNull(sender.state.value.pending)
        sender.edit("Исправленный текст")
        runCurrent()
        assertTrue(sender.state.value.canSend)
    }
}
