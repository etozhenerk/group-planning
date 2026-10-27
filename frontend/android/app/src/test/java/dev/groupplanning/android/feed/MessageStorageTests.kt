@file:OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)

package dev.groupplanning.android.feed

import dev.groupplanning.android.data.api.WireResponse
import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.state.feed.MessageSender
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.encodeToString
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class MessageStorageTests {
    @Test fun failedDurableWriteKeepsDraftAndDoesNotPost() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val sender = MessageSender(h.repository, backgroundScope) {}
        sender.open(h.repository.open(h.id))
        sender.edit("Пиццу закажу я")
        runCurrent()

        h.disk.failWrites = true
        sender.send()
        runCurrent()
        assertEquals("Пиццу закажу я", sender.state.value.draft)
        assertNull(sender.state.value.pending)
        assertTrue(sender.state.value.storageError)
        assertTrue(h.transport.requests.none { it.method == "POST" })

        h.disk.failWrites = false
        h.transport.handle("${h.path}/messages") {
            val pending = checkNotNull(sender.state.value.pending)
            WireResponse(
                201,
                "application/json",
                apiJson.encodeToString(h.entry(2, pending.key, pending.text)),
            )
        }
        sender.send()
        runCurrent()
        assertNull(sender.state.value.pending)
        assertEquals(1, h.transport.requests.count { it.method == "POST" })
        assertFalse(sender.state.value.storageError)
    }
}
