package dev.groupplanning.android.feed

import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.ChatProjection
import dev.groupplanning.android.data.api.models.ChatSnapshot
import dev.groupplanning.android.data.api.models.EntryReactions
import dev.groupplanning.android.data.api.models.ServerCounter
import dev.groupplanning.android.support.Fixtures
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ChatWireTests {
    @Test fun projectionDecodesBackendReactionsEnvelopeAndPreservesScopedEntry() {
        val entry = apiJson.parseToJsonElement(Fixtures.json("late-message-retry"))
        val id = (entry as kotlinx.serialization.json.JsonObject).getValue("id")
        val wire = buildJsonObject {
            put("resource_kind", "entry")
            put("resource_id", id)
            put("projection_version", "9007199254740993")
            put("entry", entry)
            put(
                "reactions",
                JsonArray(
                    listOf(
                        buildJsonObject {
                            put("entry_id", id)
                            put("reactions", JsonArray(emptyList()))
                        },
                    ),
                ),
            )
        }
        val value = apiJson.decodeFromString<ChatProjection>(wire.toString())
        assertEquals(value.entry?.id, value.reactions?.single()?.entryId)
        assertTrue(value.validFor(checkNotNull(value.entry).meetingId))
        assertFalse(value.validFor(java.util.UUID.randomUUID()))
        assertEquals("9007199254740993", value.version.value)
    }

    @Test fun reactionOnlySnapshotChecksSeparateEntryAndRejectsForeignResource() = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val entry = h.entry(1)
        val projection = ChatProjection(
            "entry",
            entry.id,
            ServerCounter("1"),
            reactions = listOf(EntryReactions(entry.id, emptyList())),
        )
        val snapshot = ChatFixtures.snapshot(listOf(entry)).copy(projections = listOf(projection))
        h.transport.enqueue(
            "${h.path}/sync",
            apiJson.encodeToString(ChatSnapshot.serializer(), snapshot),
        )
        assertEquals(snapshot, h.repository.chat.snapshot(h.repository.open(h.id)))
        assertFalse(projection.copy(reactions = null).validFor(h.id))
        assertFalse(projection.copy(resourceId = java.util.UUID.randomUUID()).validFor(h.id))
    }
}
