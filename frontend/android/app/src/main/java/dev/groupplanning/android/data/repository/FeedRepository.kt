package dev.groupplanning.android.data.repository

import dev.groupplanning.android.data.api.ApiRequest
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import dev.groupplanning.android.data.api.models.DatePoll
import dev.groupplanning.android.data.api.models.EntryReactions
import dev.groupplanning.android.data.api.models.FeedEntry
import dev.groupplanning.android.data.api.models.FeedPage
import dev.groupplanning.android.data.api.models.Meeting
import dev.groupplanning.android.data.api.models.Participant
import dev.groupplanning.android.data.api.models.Participants
import dev.groupplanning.android.data.api.models.PlacePoll
import dev.groupplanning.android.data.api.models.PreparationTask
import dev.groupplanning.android.data.api.models.ReactionIntent
import dev.groupplanning.android.data.api.models.ReactionsPage
import dev.groupplanning.android.data.api.models.ServerCounter
import dev.groupplanning.android.data.api.models.UpdateMeeting
import dev.groupplanning.android.data.api.requests.FeedRequests
import dev.groupplanning.android.data.api.requests.MeetingRequests
import dev.groupplanning.android.data.outbox.MessageOutbox
import dev.groupplanning.android.data.outbox.MessageRecord
import dev.groupplanning.android.data.outbox.PendingMessage
import dev.groupplanning.android.data.session.MeetingAccess
import dev.groupplanning.android.data.session.SessionRepository
import java.util.UUID
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject

internal class FeedRepository(
    private val session: SessionRepository,
    private val outbox: MessageOutbox,
    val media: MediaRepository? = null,
) {
    val snapshot = session.state

    suspend fun reactions(access: MeetingAccess, ids: List<UUID>): List<EntryReactions> =
        session.authenticated(
            ApiRequest(
                listOf("meetings", access.id.toString(), "reactions"),
                repeatedQuery = ids.take(50).map { "entry_id" to it.toString() },
                meetingId = access.id,
                revokesAccessOnForbidden = true,
            ),
            ReactionsPage.serializer(),
            expectedLease = access.request,
        ).entries

    suspend fun react(access: MeetingAccess, intent: ReactionIntent): EntryReactions =
        session.authenticated(
            ApiRequest(
                listOf(
                    "meetings",
                    access.id.toString(),
                    "messages",
                    intent.entry.toString(),
                    "reactions",
                ),
                "PUT",
                buildJsonObject {
                    put("emoji", JsonPrimitive(intent.emoji))
                    put("active", JsonPrimitive(intent.active))
                }.toString(),
                intent.key,
                meetingId = access.id,
                revokesAccessOnForbidden = true,
            ),
            EntryReactions.serializer(),
            expectedLease = access.request,
        )

    suspend fun poll(access: MeetingAccess, request: ApiRequest): DatePoll {
        val poll = session.authenticated(
            request,
            DatePoll.serializer(),
            expectedLease = access.request,
        )
        if (poll.meetingId != access.id) throw ClientFailure(FailureKind.InvalidResponse)
        return poll
    }

    suspend fun placePoll(access: MeetingAccess, request: ApiRequest): PlacePoll {
        val poll = session.authenticated(
            request,
            PlacePoll.serializer(),
            expectedLease = access.request,
        )
        if (poll.meetingId != access.id) throw ClientFailure(FailureKind.InvalidResponse)
        return poll
    }

    suspend fun preparationTask(access: MeetingAccess, request: ApiRequest): PreparationTask {
        val task = session.authenticated(
            request,
            PreparationTask.serializer(),
            expectedLease = access.request,
        )
        if (task.meetingId != access.id) throw ClientFailure(FailureKind.InvalidResponse)
        return task
    }

    suspend fun taskParticipants(access: MeetingAccess): List<Participant> = session.authenticated(
        MeetingRequests.participants(access.id),
        Participants.serializer(),
        expectedLease = access.request,
    ).participants

    suspend fun open(id: UUID): MeetingAccess = session.meetingAccess(id)

    suspend fun record(access: MeetingAccess): MessageRecord = session.withAccess(access) {
        outbox.read(access.profile.id, access.id)
    }

    suspend fun update(
        access: MeetingAccess,
        transform: (MessageRecord) -> MessageRecord,
    ): MessageRecord = session.withAccess(access) {
        outbox.update(access.profile.id, access.id, transform)
    }

    suspend fun page(
        access: MeetingAccess,
        after: ServerCounter? = null,
        before: ServerCounter? = null,
    ): FeedPage {
        val page = session.authenticated(
            FeedRequests.page(access.id, after, before),
            FeedPage.serializer(),
            expectedLease = access.request,
        )
        if (page.entries.any { it.meetingId != access.id } ||
            page.entries.zipWithNext().any { (a, b) -> a.sequence >= b.sequence } ||
            page.entries.any {
                after != null &&
                    it.sequence <= after ||
                    before != null &&
                    it.sequence >= before
            } ||
            page.hasMore &&
            page.entries.isEmpty()
        ) {
            throw ClientFailure(FailureKind.InvalidResponse)
        }
        return page
    }

    suspend fun send(access: MeetingAccess, pending: PendingMessage): FeedEntry {
        val entry = session.authenticated(
            FeedRequests.message(access.id, pending.text, pending.key),
            FeedEntry.serializer(),
            expectedLease = access.request,
        )
        if (entry.meetingId != access.id ||
            entry.actor.id != access.profile.id ||
            entry.clientRequestId != pending.key ||
            entry.messageText == null
        ) {
            throw ClientFailure(FailureKind.InvalidResponse)
        }
        return entry
    }

    suspend fun details(access: MeetingAccess): Meeting = session.authenticated(
        MeetingRequests.details(access.id),
        Meeting.serializer(),
        expectedLease = access.request,
    ) { data, meeting ->
        if (meeting.id != access.id) throw ClientFailure(FailureKind.InvalidResponse)
        data.copy(
            details =
            data.details + (access.id to ResourceState(ResourcePhase.Ready, meeting)),
        )
    }

    suspend fun save(access: MeetingAccess, input: UpdateMeeting, key: UUID): Meeting =
        session.authenticated(
            MeetingRequests.update(access.id, input, key),
            Meeting.serializer(),
            expectedLease = access.request,
        ) { data, meeting ->
            if (meeting.id != access.id) throw ClientFailure(FailureKind.InvalidResponse)
            data.copy(
                details =
                data.details + (access.id to ResourceState(ResourcePhase.Ready, meeting)),
            )
        }
}
