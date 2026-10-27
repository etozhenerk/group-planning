@file:OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)

package dev.groupplanning.android.feed

import dev.groupplanning.android.data.api.WireResponse
import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.outbox.DeliveryStatus
import dev.groupplanning.android.data.outbox.MessageRecord
import dev.groupplanning.android.data.outbox.PendingMessage
import dev.groupplanning.android.state.feed.MessageSender
import dev.groupplanning.android.support.Fixtures
import java.util.UUID
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class MessageQueueTests {
    @Test fun queueIsDurableAndSerialWhileComposerAcceptsNextDraft() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val sender = MessageSender(h.repository, backgroundScope) {}
        sender.open(h.repository.open(h.id))
        val response = CompletableDeferred<WireResponse>()
        h.transport.handle("${h.path}/messages") { response.await() }
        sender.edit("Первое")
        runCurrent()
        sender.send()
        runCurrent()
        val first = sender.state.value.queue.single()
        sender.edit("Второе")
        runCurrent()
        sender.send()
        runCurrent()
        assertEquals(
            listOf("Первое", "Второе"),
            h.outbox.read(Fixtures.userId, h.id).queue.map {
                it.text
            },
        )
        assertEquals(1, h.transport.requests.count { it.method == "POST" })
        sender.edit("Новый черновик")
        runCurrent()
        val second = sender.state.value.queue.last()
        h.transport.enqueue(
            "${h.path}/messages",
            apiJson.encodeToString(h.entry(2, second.key, second.text)),
            201,
        )
        response.complete(
            WireResponse(
                201,
                "application/json",
                apiJson.encodeToString(h.entry(1, first.key, first.text)),
            ),
        )
        runCurrent()
        assertTrue(sender.state.value.queue.isEmpty())
        assertEquals("Новый черновик", sender.state.value.draft)
        assertEquals(2, h.transport.requests.count { it.method == "POST" })
    }

    @Test fun uncertainHeadBlocksLaterMessagesAndRecreatedOwnerUsesSameKey() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val access = h.repository.open(h.id)
        val first = MessageSender(h.repository, backgroundScope) {}
        first.open(access)
        first.edit("Один")
        runCurrent()
        h.transport.enqueue("${h.path}/messages", "", 503)
        first.send()
        runCurrent()
        val key = first.state.value.queue.single().key
        first.edit("Два")
        runCurrent()
        first.send()
        runCurrent()
        assertEquals(1, h.transport.requests.count { it.method == "POST" })
        first.suspend()
        val restored = MessageSender(h.repository, backgroundScope) {}
        restored.open(access)
        val queue = restored.state.value.queue
        assertEquals(DeliveryStatus.Uncertain, queue.first().status)
        assertEquals(key, queue.first().key)
        queue.forEachIndexed { index, item ->
            h.transport.enqueue(
                "${h.path}/messages",
                apiJson.encodeToString(h.entry(index + 1, item.key, item.text)),
                201,
            )
        }
        restored.resume()
        runCurrent()
        assertTrue(restored.state.value.queue.isEmpty())
        assertEquals(
            key.toString(),
            h.transport.requests.filter {
                it.method == "POST"
            }[1].header("Idempotency-Key"),
        )
    }

    @Test fun rejectedHeadDoesNotBlockNextAndWrongBodyCannotAcknowledge() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val sender = MessageSender(h.repository, backgroundScope) {}
        sender.open(h.repository.open(h.id))
        sender.edit("Один")
        runCurrent()
        h.transport.enqueue("${h.path}/messages", "", 409)
        sender.send()
        runCurrent()
        val first = sender.state.value.queue.single()
        sender.acknowledge(listOf(h.entry(1, first.key, "Другое тело")))
        assertEquals(1, sender.state.value.queue.size)
        sender.edit("Два")
        runCurrent()
        h.transport.handle("${h.path}/messages") {
            val item = sender.state.value.queue.last()
            WireResponse(
                201,
                "application/json",
                apiJson.encodeToString(h.entry(2, item.key, item.text)),
            )
        }
        sender.send()
        runCurrent()
        assertEquals(listOf(first), sender.state.value.queue)
        assertEquals(2, h.transport.requests.count { it.method == "POST" })
    }

    @Test fun explicitRejectedRetryPreservesTheOriginalIntentKey() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val sender = MessageSender(h.repository, backgroundScope) {}
        sender.open(h.repository.open(h.id))
        sender.edit("Повтор")
        runCurrent()
        h.transport.enqueue("${h.path}/messages", "", 422)
        sender.send()
        runCurrent()
        val intent = sender.state.value.queue.single()
        assertTrue(intent.rejected)
        h.transport.enqueue(
            "${h.path}/messages",
            apiJson.encodeToString(h.entry(1, intent.key, intent.text)),
            201,
        )
        sender.retry(intent.key)
        runCurrent()
        assertTrue(sender.state.value.queue.isEmpty())
        assertEquals(
            listOf(intent.key.toString(), intent.key.toString()),
            h.transport.requests.filter {
                it.method == "POST"
            }.map { it.header("Idempotency-Key") },
        )
    }

    @Test fun legacySingleIntentMigratesAndOtherAccountNeverReadsIt() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        val intent = PendingMessage(UUID.randomUUID(), "Старый", Fixtures.expiry)
        h.disk.save(listOf(MessageRecord(Fixtures.userId, h.id, "Черновик", intent)))
        val migrated = h.outbox.read(Fixtures.userId, h.id)
        assertEquals(listOf(intent), migrated.queue)
        assertEquals("Черновик", migrated.draft)
        assertTrue(h.outbox.read(UUID.randomUUID(), h.id).queue.isEmpty())
        assertFalse(migrated.queue.isEmpty())
    }

    @Test fun lateAcknowledgmentAfterRevokeDoesNotRestorePrivateQueueOrRows() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val received = mutableListOf<String>()
        val sender = MessageSender(h.repository, backgroundScope) {
            received +=
                it.messageText.orEmpty()
        }
        sender.open(h.repository.open(h.id))
        val response = CompletableDeferred<WireResponse>()
        h.transport.handle("${h.path}/messages") {
            withContext(NonCancellable) { response.await() }
        }
        sender.edit("Секрет")
        runCurrent()
        sender.send()
        runCurrent()
        val intent = sender.state.value.queue.single()
        h.session.updateAccess(h.id, false)
        sender.revoke()
        response.complete(
            WireResponse(
                201,
                "application/json",
                apiJson.encodeToString(h.entry(1, intent.key, intent.text)),
            ),
        )
        runCurrent()
        assertTrue(received.isEmpty())
        assertTrue(h.disk.load().isEmpty())
        assertTrue(sender.state.value.queue.isEmpty())
    }
}
