package dev.groupplanning.android.feed

import dev.groupplanning.android.data.api.WireResponse
import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.EntryReactions
import dev.groupplanning.android.data.api.models.MessageReaction
import dev.groupplanning.android.data.api.models.ReactionsPage
import dev.groupplanning.android.state.feed.ReactionController
import dev.groupplanning.android.support.Fixtures
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.encodeToString
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

@OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)
class ReactionTests {
    @Test fun delayedRefreshCannotReplaceAConfirmedMutation() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val access = h.repository.open(h.id)
        val id = h.entry(1).id
        val model = ReactionController(h.repository, backgroundScope)
        model.open(access)
        val late = CompletableDeferred<WireResponse>()
        h.transport.handle("${h.path}/reactions") { late.await() }
        model.visible(listOf(id))
        runCurrent()
        h.transport.enqueue(
            "${h.path}/messages/$id/reactions",
            apiJson.encodeToString(
                EntryReactions(
                    id,
                    listOf(MessageReaction("❤️", 1, true, listOf(Fixtures.user))),
                ),
            ),
        )
        model.toggle(id, "❤️")
        runCurrent()
        assertNull(model.state.value.pending)
        late.complete(
            WireResponse(
                200,
                "application/json",
                apiJson.encodeToString(ReactionsPage(listOf(EntryReactions(id, emptyList())))),
            ),
        )
        runCurrent()
        assertEquals("❤️", model.state.value.entries[id]?.single()?.emoji)
        assertEquals(true, model.state.value.entries[id]?.single()?.mine)
    }

    @Test fun syncProjectionDuringMutationSurvivesLostReply() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val model = ReactionController(h.repository, backgroundScope)
        model.open(h.repository.open(h.id))
        val id = h.entry(1).id
        val response = CompletableDeferred<WireResponse>()
        h.transport.handle("${h.path}/messages/$id/reactions") { response.await() }
        model.toggle(id, "❤️")
        runCurrent()
        val confirmed = listOf(MessageReaction("👍", 2, false, emptyList()))
        model.receive(id, confirmed)
        response.complete(WireResponse(503, "application/json", ""))
        runCurrent()
        assertEquals(confirmed, model.state.value.entries[id])
        assertNotNull(model.state.value.failed)
    }

    @Test fun lostReplyRollsBackAndRetriesTheSameExplicitIntent() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val access = h.repository.open(h.id)
        val id = h.entry(1).id
        val model = ReactionController(h.repository, backgroundScope)
        model.open(access)
        model.visible(listOf(id, h.entry(2).id))
        h.transport.enqueue(
            "${h.path}/reactions",
            apiJson.encodeToString(
                ReactionsPage(
                    listOf(
                        EntryReactions(id, emptyList()),
                    ),
                ),
            ),
        )
        runCurrent()
        assertEquals(2, h.transport.requests.last().url.queryParameterValues("entry_id").size)
        val path = "${h.path}/messages/$id/reactions"
        h.transport.enqueue(path, status = 503)
        model.toggle(id, "❤️")
        assertEquals(1, model.state.value.entries[id]?.single()?.count)
        runCurrent()
        assertEquals(emptyList<MessageReaction>(), model.state.value.entries[id])
        assertNotNull(model.state.value.failed)
        val key = h.transport.requests.last().header("Idempotency-Key")
        h.transport.enqueue(
            path,
            apiJson.encodeToString(
                EntryReactions(
                    id,
                    listOf(
                        MessageReaction("❤️", 1, true, listOf(Fixtures.user)),
                    ),
                ),
            ),
        )
        model.retry()
        runCurrent()
        assertEquals(key, h.transport.requests.last().header("Idempotency-Key"))
        assertNull(model.state.value.failed)
        assertEquals(true, model.state.value.entries[id]?.single()?.mine)
        h.transport.enqueue(path, apiJson.encodeToString(EntryReactions(id, emptyList())))
        model.toggle(id, "❤️")
        runCurrent()
        assertFalse(model.state.value.entries[id].orEmpty().any { it.mine })
        model.revoke()
        assertEquals(emptyMap<Any, Any>(), model.state.value.entries)
    }
}
