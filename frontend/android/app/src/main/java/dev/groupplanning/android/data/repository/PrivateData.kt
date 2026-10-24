package dev.groupplanning.android.data.repository

import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.models.FeedPage
import dev.groupplanning.android.data.api.models.Meeting
import dev.groupplanning.android.data.api.models.MeetingsPage
import dev.groupplanning.android.data.api.models.Participants
import java.util.UUID

internal data class PrivateData(
    val invitations: SavedInvitationsData = SavedInvitationsData(),
    val calendar: CalendarData = CalendarData(),
    val meetings: ResourceState<MeetingsPage> = ResourceState(),
    val meetingsEpoch: UUID = UUID.randomUUID(),
    val moreRequest: UUID? = null,
    val moreError: ClientFailure? = null,
    val details: Map<UUID, ResourceState<Meeting>> = emptyMap(),
    val feeds: Map<UUID, ResourceState<FeedPage>> = emptyMap(),
    val participants: Map<UUID, ResourceState<Participants>> = emptyMap(),
    val denied: Set<UUID> = emptySet(),
    val accessVersions: Map<UUID, Long> = emptyMap(),
) {
    fun accessVersion(id: UUID?): Long = accessVersions[id] ?: 0

    fun changeAccess(id: UUID, allowed: Boolean): PrivateData = copy(
        calendar = calendar.copy(
            page = calendar.page?.let { page ->
                page.copy(meetings = page.meetings.filter { it.id != id })
            },
        ),
        details = details - id,
        feeds = feeds - id,
        participants = participants - id,
        denied = if (allowed) denied - id else denied + id,
        accessVersions = accessVersions + (id to (accessVersion(id) + 1)),
        meetings = meetings.copy(
            value = meetings.value?.let { page ->
                page.copy(meetings = page.meetings.filter { it.id != id })
            },
        ),
    )
}
