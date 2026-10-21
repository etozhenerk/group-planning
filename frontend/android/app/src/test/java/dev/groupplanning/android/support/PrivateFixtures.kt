package dev.groupplanning.android.support

import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.data.api.models.FeedPage
import dev.groupplanning.android.data.api.models.Participants
import dev.groupplanning.android.data.api.models.RsvpAnswer
import dev.groupplanning.android.data.api.models.ServerCounter
import java.util.UUID
import kotlinx.serialization.encodeToString

internal suspend fun SessionHarness.seed(id: UUID = Fixtures.meetingId) {
    transport.enqueue("meetings/$id", apiJson.encodeToString(Fixtures.meeting(id)))
    meetings.loadMeeting(id)
    val entry = apiJson.decodeFromString<FeedEntry>(Fixtures.json("late-message-retry"))
    val feed = FeedPage(
        listOf(entry.copy(meetingId = id)),
        false,
        ServerCounter.Zero,
        2,
        RsvpAnswer.Going,
        ServerCounter("1"),
        entry.sequence,
    )
    transport.enqueue("meetings/$id/feed", apiJson.encodeToString(feed))
    meetings.loadFeed(id)
    transport.enqueue(
        "meetings/$id/participants",
        apiJson.encodeToString(Participants(emptyList())),
    )
    meetings.loadParticipants(id)
}
