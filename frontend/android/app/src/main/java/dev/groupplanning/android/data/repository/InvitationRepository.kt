package dev.groupplanning.android.data.repository

import dev.groupplanning.android.data.api.ApiClient
import dev.groupplanning.android.data.api.ApiRequest
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import dev.groupplanning.android.data.api.models.InvitationLink
import dev.groupplanning.android.data.api.models.InvitationPreview
import dev.groupplanning.android.data.api.models.Meeting
import dev.groupplanning.android.data.api.models.RsvpRequest
import dev.groupplanning.android.data.api.models.RsvpResult
import dev.groupplanning.android.data.api.requests.InvitationRequests
import dev.groupplanning.android.data.api.requests.MeetingRequests
import dev.groupplanning.android.data.links.InvitationLinks
import dev.groupplanning.android.data.links.InvitationTarget
import dev.groupplanning.android.data.session.SessionRepository
import dev.groupplanning.android.data.session.SessionState
import java.util.UUID

internal class InvitationRepository(
    private val api: ApiClient,
    private val session: SessionRepository,
    private val links: InvitationLinks,
) {
    val snapshot = session.state
    private val meetings = MeetingRepository(session)

    suspend fun load(target: InvitationTarget, previous: InvitationPreview?): InvitationDetails {
        val generation = session.beginData { it }
        val preview = when (target) {
            is InvitationTarget.Token -> {
                val request = InvitationRequests.preview(target.value)
                if (generation == null) {
                    api.send(request, InvitationPreview.serializer())
                } else {
                    session.authenticated(request, InvitationPreview.serializer(), generation)
                }
            }
            is InvitationTarget.Meeting -> previous
        }
        if (generation == null) {
            return InvitationDetails(
                preview ?: throw ClientFailure(FailureKind.Http, 401),
            )
        }
        val id = when (target) {
            is InvitationTarget.Token -> checkNotNull(preview).meetingId
            is InvitationTarget.Meeting -> target.id
        }
        // A fresh server probe must work even after local access was revoked.
        // It never returns cached details and does not grant access optimistically.
        val meeting = try {
            session.authenticated(
                ApiRequest(listOf("meetings", id.toString())),
                Meeting.serializer(),
                generation,
            )
        } catch (error: ClientFailure) {
            if (error.status != 403) throw error
            session.updateAccess(id, allowed = false, generation)
            val current = error.problem?.currentResponse
            val public = preview ?: throw error
            return InvitationDetails(
                public.copy(
                    myRsvp = current?.rsvp ?: public.myRsvp,
                    myRsvpRevision = current?.rsvpRevision ?: public.myRsvpRevision,
                ),
            )
        }
        if (meeting.id != id) throw ClientFailure(FailureKind.InvalidResponse)
        if (id in snapshot.value.data.denied) session.updateAccess(id, allowed = true, generation)
        session.updateData(generation) {
            it.copy(details = it.details + (id to ResourceState(ResourcePhase.Ready, meeting)))
        }
        val profile = (snapshot.value.session as? SessionState.Authenticated)?.profile
        return InvitationDetails(meeting.preview(), meeting, meeting.organizerId == profile?.id)
    }

    suspend fun respond(
        target: InvitationTarget,
        id: UUID,
        input: RsvpRequest,
        key: UUID,
    ): RsvpResult {
        val generation = session.beginData { it } ?: throw ClientFailure(FailureKind.Http, 401)
        val request = when (target) {
            is InvitationTarget.Token -> InvitationRequests.respond(target.value, input, key)
            is InvitationTarget.Meeting -> InvitationRequests.respond(target.id, input, key)
        }
        val result = session.authenticated(request, RsvpResult.serializer(), generation)
        if (result.meetingId != id) throw ClientFailure(FailureKind.InvalidResponse)
        session.updateAccess(id, result.canAccessFeed, generation)
        return result
    }

    suspend fun share(id: UUID): String {
        val result = session.authenticated(
            MeetingRequests.invitation(id),
            InvitationLink.serializer(),
        )
        if (!links.shareable(result.invitationUrl)) throw ClientFailure(FailureKind.InvalidResponse)
        return result.invitationUrl
    }

    suspend fun loadPrivate(id: UUID) {
        meetings.loadParticipants(id)
        meetings.loadFeed(id)
    }

    suspend fun refreshList() = meetings.loadMeetings()
}
