package dev.groupplanning.android.feed

import dev.groupplanning.android.data.api.models.ChatChange
import dev.groupplanning.android.data.api.models.ChatChanges
import dev.groupplanning.android.data.api.models.ChatMeeting
import dev.groupplanning.android.data.api.models.ChatProjection
import dev.groupplanning.android.data.api.models.ChatRange
import dev.groupplanning.android.data.api.models.ChatSnapshot
import dev.groupplanning.android.data.api.models.EntryReactions
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.data.api.models.MeetingPeriod
import dev.groupplanning.android.data.api.models.ServerCounter
import dev.groupplanning.android.support.Fixtures

internal object ChatFixtures {
    val meeting = Fixtures.meeting().let {
        ChatMeeting(
            it.id, it.organizerId, it.title, it.description, it.startsOn, it.startsAt,
            it.timezone, it.place, it.coverUrl, MeetingPeriod.Upcoming, it.revision,
            it.participantCount, it.myRsvp, it.myRsvpRevision,
        )
    }
    fun snapshot(entries: List<FeedEntry>, cursor: String = "c1", epoch: String = "e1") =
        ChatSnapshot(
            "snapshot", epoch, cursor, entries,
            entries.filter { it.kind == "message" }.map {
                ChatProjection(
                    "entry",
                    it.id,
                    ServerCounter("1"),
                    reactions = listOf(
                        EntryReactions(
                            it.id,
                            emptyList(),
                        ),
                    ),
                )
            },
            meeting,
            ServerCounter("1"), entries.lastOrNull()?.sequence ?: ServerCounter.Zero,
            ChatRange(
                entries.firstOrNull()?.sequence,
                entries.lastOrNull()?.sequence,
            ),
            false, false,
        )
    fun projection(entry: FeedEntry, version: String = "1") = ChatProjection(
        "entry",
        entry.id,
        ServerCounter(version),
        entry,
    )
    fun changes(
        entries: List<FeedEntry> = emptyList(),
        cursor: String = "c1",
        through: String = cursor,
        more: Boolean = false,
        epoch: String = "e1",
        version: String = "2",
    ) = ChatChanges(
        "changes",
        epoch,
        cursor,
        through,
        more,
        entries.map {
            ChatChange(
                "entry_upsert",
                ServerCounter(version),
                it.id,
                "entry",
                it.id,
                projection(it, version),
            )
        },
        meeting,
        ServerCounter(version),
    )
}
