package dev.groupplanning.android.data.session

import dev.groupplanning.android.data.api.models.UserProfile
import java.util.UUID

internal data class MeetingAccess(val request: RequestLease, val profile: UserProfile) {
    val id: UUID get() = checkNotNull(request.meetingId)
}
