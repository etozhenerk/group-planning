package dev.groupplanning.android.feed

import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.ChatProjection
import dev.groupplanning.android.data.api.models.ChatSnapshot
import dev.groupplanning.android.data.api.models.DatePoll
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.data.api.models.PlacePoll
import dev.groupplanning.android.data.api.models.PreparationTask
import dev.groupplanning.android.data.api.models.ServerCounter
import dev.groupplanning.android.support.Fixtures
import java.util.UUID
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ChatSnapshotProjectionTests {
    @Test fun snapshotAcceptsTaskLinkedToItsSeparateEntry() = verifySnapshot("preparation_task")

    @Test fun snapshotAcceptsDatePollLinkedToItsSeparateEntry() = verifySnapshot("date_poll")

    @Test fun snapshotAcceptsPlacePollLinkedToItsSeparateEntry() = verifySnapshot("place_poll")

    private fun verifySnapshot(kind: String) = runTest {
        val h = FeedHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val projection = projection(kind, h.entry(1))
        val resource = checkNotNull(
            projection.task?.id ?: projection.datePoll?.id ?: projection.placePoll?.id,
        )
        val key = if (kind == "preparation_task") "task_id" else "poll_id"
        val entry = h.entry(1).copy(
            id = projection.resourceId,
            kind = "${kind}_created",
            payload = buildJsonObject { put(key, resource.toString()) },
        )
        val snapshot = ChatFixtures.snapshot(listOf(entry)).copy(projections = listOf(projection))
        h.transport.enqueue(
            "${h.path}/sync",
            apiJson.encodeToString(ChatSnapshot.serializer(), snapshot),
        )
        assertEquals(snapshot, h.repository.chat.snapshot(h.repository.open(h.id)))
        for (invalid in listOf(
            entry.copy(id = UUID.randomUUID()),
            entry.copy(meetingId = UUID.randomUUID()),
            entry.copy(kind = "message"),
            entry.copy(payload = buildJsonObject { put(key, UUID.randomUUID().toString()) }),
        )) {
            reject(h, snapshot.copy(entries = listOf(invalid)))
        }
        reject(h, snapshot.copy(entries = emptyList()))
        val foreign = UUID.randomUUID()
        reject(
            h,
            snapshot.copy(
                projections = listOf(
                    projection.copy(
                        task = projection.task?.copy(meetingId = foreign),
                        datePoll = projection.datePoll?.copy(meetingId = foreign),
                        placePoll = projection.placePoll?.copy(meetingId = foreign),
                    ),
                ),
            ),
        )
        assertTrue(projection.copy(resourceKind = kind, resourceId = resource).validFor(h.id))
    }

    private suspend fun reject(h: FeedHarness, snapshot: ChatSnapshot) {
        h.transport.enqueue(
            "${h.path}/sync",
            apiJson.encodeToString(ChatSnapshot.serializer(), snapshot),
        )
        var rejected = false
        try {
            h.repository.chat.snapshot(h.repository.open(h.id))
        } catch (_: ClientFailure) {
            rejected = true
        }
        assertTrue("Snapshot must reject a supplement without its matching, scoped entry", rejected)
    }

    private fun projection(kind: String, entry: FeedEntry): ChatProjection = when (kind) {
        "preparation_task" -> ChatProjection(
            "entry",
            entry.id,
            ServerCounter("1"),
            task = apiJson.decodeFromString<PreparationTask>(
                Fixtures.json("preparation-task-offered"),
            )
                .copy(meetingId = entry.meetingId),
        )
        "date_poll" -> ChatProjection(
            "entry",
            entry.id,
            ServerCounter("1"),
            datePoll = apiJson.decodeFromString<DatePoll>(Fixtures.json("date-poll-hidden"))
                .copy(meetingId = entry.meetingId),
        )
        else -> ChatProjection(
            "entry",
            entry.id,
            ServerCounter("1"),
            placePoll = apiJson.decodeFromString<PlacePoll>(Fixtures.json("place-poll-open"))
                .copy(meetingId = entry.meetingId),
        )
    }
}
