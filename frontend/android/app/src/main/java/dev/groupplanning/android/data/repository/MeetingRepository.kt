package dev.groupplanning.android.data.repository

import dev.groupplanning.android.data.api.ApiRequest
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.models.FeedPage
import dev.groupplanning.android.data.api.models.Meeting
import dev.groupplanning.android.data.api.models.MeetingsPage
import dev.groupplanning.android.data.api.models.Participants
import dev.groupplanning.android.data.api.requests.FeedRequests
import dev.groupplanning.android.data.api.requests.MeetingRequests
import dev.groupplanning.android.data.session.SessionRepository
import java.util.UUID
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.withContext
import kotlinx.serialization.DeserializationStrategy

internal class MeetingRepository(private val session: SessionRepository) {
    val state = session.state

    suspend fun loadMeetings() {
        val beforeRead = state.value.data.readVersions
        session.beginData {
            it.copy(meetingsEpoch = UUID.randomUUID(), moreRequest = null, moreError = null)
        }
        load(
            MeetingRequests.list(),
            MeetingsPage.serializer(),
            read = { it.meetings },
            write = { data, resource ->
                val page = resource.value?.let { page ->
                    page.copy(
                        meetings = data.preserveNewerReadState(page.meetings, beforeRead)
                            .filter { it.id !in data.denied },
                    )
                }
                data.copy(meetings = resource.copy(value = page))
            },
        )
    }

    suspend fun loadMeeting(id: UUID) = load(
        MeetingRequests.details(id),
        Meeting.serializer(),
        read = { it.details[id] ?: ResourceState() },
        write = { data, resource -> data.copy(details = data.details + (id to resource)) },
    )

    suspend fun loadFeed(id: UUID) = load(
        FeedRequests.page(id),
        FeedPage.serializer(),
        read = { it.feeds[id] ?: ResourceState() },
        write = { data, resource -> data.copy(feeds = data.feeds + (id to resource)) },
    )

    suspend fun loadParticipants(id: UUID) = load(
        MeetingRequests.participants(id),
        Participants.serializer(),
        read = { it.participants[id] ?: ResourceState() },
        write = { data, resource ->
            data.copy(participants = data.participants + (id to resource))
        },
    )

    suspend fun loadMore() {
        val snapshot = state.value.data
        val cursor = snapshot.meetings.value?.nextCursor ?: return
        if (snapshot.moreRequest != null || snapshot.meetings.phase == ResourcePhase.Loading) return
        val request = UUID.randomUUID()
        val epoch = snapshot.meetingsEpoch
        val generation =
            session.beginData { it.copy(moreRequest = request, moreError = null) } ?: return
        try {
            session.authenticated(
                MeetingRequests.list(cursor),
                MeetingsPage.serializer(),
                generation,
            ) { data, page ->
                if (data.meetingsEpoch != epoch || data.moreRequest != request) {
                    data
                } else {
                    val combined = (
                        data.meetings.value?.meetings.orEmpty() +
                            data.preserveNewerReadState(page.meetings, snapshot.readVersions)
                        )
                        .distinctBy { it.id }.filter { it.id !in data.denied }
                    data.copy(
                        meetings = data.meetings.copy(value = page.copy(meetings = combined)),
                        moreRequest = null,
                    )
                }
            }
        } catch (cancelled: CancellationException) {
            withContext(NonCancellable) {
                session.updateData(generation) {
                    if (it.moreRequest == request) {
                        it.copy(moreRequest = null)
                    } else {
                        it
                    }
                }
            }
            throw cancelled
        } catch (error: ClientFailure) {
            session.updateData(generation) {
                if (it.moreRequest == request) {
                    it.copy(moreRequest = null, moreError = error)
                } else {
                    it
                }
            }
        }
    }

    private suspend fun <T> load(
        request: ApiRequest,
        serializer: DeserializationStrategy<T>,
        read: (PrivateData) -> ResourceState<T>,
        write: (PrivateData, ResourceState<T>) -> PrivateData,
    ) {
        val id = UUID.randomUUID()
        val version = session.beginData { data ->
            if (request.meetingId in data.denied) data else write(data, read(data).begin(id))
        } ?: return
        if (read(state.value.data).requestId != id) return
        try {
            session.authenticated(request, serializer, version) { data, value ->
                if (read(data).requestId != id) {
                    data
                } else {
                    write(data, ResourceState(phase = ResourcePhase.Ready, value = value))
                }
            }
        } catch (cancelled: CancellationException) {
            withContext(NonCancellable) {
                session.updateData(version) { data ->
                    if (read(data).requestId != id) data else write(data, read(data).cancelled())
                }
            }
            throw cancelled
        } catch (error: ClientFailure) {
            session.updateData(version) { data ->
                if (read(data).requestId != id) {
                    data
                } else {
                    write(
                        data,
                        read(
                            data,
                        ).copy(phase = ResourcePhase.Failed, error = error, requestId = null),
                    )
                }
            }
        }
    }
}
