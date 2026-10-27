package dev.groupplanning.android.data.repository

import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import dev.groupplanning.android.data.api.models.ChatCapabilities
import dev.groupplanning.android.data.api.models.ChatChanges
import dev.groupplanning.android.data.api.models.ChatSnapshot
import dev.groupplanning.android.data.api.requests.ChatRequests
import dev.groupplanning.android.data.realtime.ChatRealtime
import dev.groupplanning.android.data.realtime.ChatSignal
import dev.groupplanning.android.data.session.MeetingAccess
import dev.groupplanning.android.data.session.SessionRepository
import java.util.UUID
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.emptyFlow

internal class ChatRepository(
    private val session: SessionRepository,
    private val realtime: ChatRealtime? = null,
) {
    suspend fun capabilities(access: MeetingAccess): ChatCapabilities = try {
        session.authenticated(
            ChatRequests.capabilities,
            ChatCapabilities.serializer(),
            expectedLease = access.request,
        ).let { if (it.protocolVersion == 1) it else ChatCapabilities(1, false, false, false) }
    } catch (error: ClientFailure) {
        if (error.status == 404) ChatCapabilities(1, false, false, false) else throw error
    }

    suspend fun snapshot(access: MeetingAccess, around: UUID? = null): ChatSnapshot {
        val result = session.authenticated(
            ChatRequests.sync(access.id, around = around),
            ChatSnapshot.serializer(),
            expectedLease = access.request,
        )
        validate(
            result.mode == "snapshot" &&
                result.meeting.id == access.id &&
                result.epoch.isNotEmpty() &&
                result.cursor.isNotEmpty() &&
                result.cursor.length <= 2048 &&
                result.projections.size <= 100 &&
                result.projections.all { projection ->
                    projection.validFor(access.id) &&
                        (
                            projection.resourceKind != "entry" ||
                                result.entries.any { it.id == projection.resourceId }
                            )
                } &&
                result.entries.size <= 100 &&
                result.entries.all { it.meetingId == access.id } &&
                result.entries.zipWithNext().all { (a, b) -> a.sequence < b.sequence },
        )
        return result
    }

    suspend fun changes(access: MeetingAccess, cursor: String): ChatChanges {
        val result = session.authenticated(
            ChatRequests.sync(access.id, cursor),
            ChatChanges.serializer(),
            expectedLease = access.request,
        )
        validate(
            result.mode == "changes" &&
                result.meeting.id == access.id &&
                result.epoch.isNotEmpty() &&
                result.cursor.isNotEmpty() &&
                result.cursor.length <= 2048 &&
                result.through.isNotEmpty() &&
                result.changes.size <= 100 &&
                (!result.hasMore || result.cursor != cursor),
        )
        return result
    }

    fun personalEvents(): Flow<ChatSignal> = kotlinx.coroutines.flow.flow {
        val transport = realtime ?: return@flow
        val generation = session.state.value.generation
        while (session.state.value.generation == generation) {
            try {
                val capability = session.authenticated(
                    ChatRequests.capabilities,
                    ChatCapabilities.serializer(),
                    expectedGeneration = generation,
                )
                if (capability.protocolVersion != 1 || !capability.realtime) return@flow
                session.personalRealtime(transport, generation).collect { emit(it) }
            } catch (cancelled: kotlinx.coroutines.CancellationException) {
                throw cancelled
            } catch (_: ClientFailure) {
                emit(ChatSignal.Disconnected)
            }
            kotlinx.coroutines.delay(3_000)
        }
    }

    fun events(access: MeetingAccess): Flow<ChatSignal> =
        realtime?.let { session.realtime(access, it) } ?: emptyFlow()

    suspend fun verify(access: MeetingAccess) = session.verify(access)

    suspend fun revoke(access: MeetingAccess) = session.updateAccess(
        access.id,
        false,
        access.request.generation,
    )

    suspend fun meeting(
        access: MeetingAccess,
        value: dev.groupplanning.android.data.api.models.ChatMeeting,
        refreshPeople: Boolean = false,
    ) {
        val previous = session.state.value.data.details[access.id]?.value
        session.updateAccessData(access) { data ->
            val old = data.details[access.id]?.value
            if (old == null || old.revision > value.revision) {
                data
            } else {
                data.copy(
                    details =
                    data.details +
                        (access.id to ResourceState(ResourcePhase.Ready, value.merge(old))),
                )
            }
        }
        if (refreshPeople ||
            previous?.participantCount?.let { it != value.participantCount } == true
        ) {
            val people = session.authenticated(
                dev.groupplanning.android.data.api.requests.MeetingRequests.participants(access.id),
                dev.groupplanning.android.data.api.models.Participants.serializer(),
                expectedLease = access.request,
            )
            session.updateAccessData(access) { data ->
                data.copy(
                    participants = data.participants +
                        (access.id to ResourceState(ResourcePhase.Ready, people)),
                )
            }
        }
    }

    suspend fun personal(access: MeetingAccess) {
        val beforeRead = session.state.value.data.readVersions
        session.authenticated(
            dev.groupplanning.android.data.api.requests.MeetingRequests.list(),
            dev.groupplanning.android.data.api.models.MeetingsPage.serializer(),
            expectedLease = access.request,
        ) { data, page ->
            data.copy(
                meetings = ResourceState(
                    ResourcePhase.Ready,
                    page.copy(
                        meetings = data.preserveNewerReadState(page.meetings, beforeRead)
                            .filter { it.id !in data.denied },
                    ),
                ),
                meetingsEpoch = UUID.randomUUID(),
                moreRequest = null,
                moreError = null,
            )
        }
    }

    private fun validate(valid: Boolean) {
        if (!valid) throw ClientFailure(FailureKind.InvalidResponse)
    }
}
