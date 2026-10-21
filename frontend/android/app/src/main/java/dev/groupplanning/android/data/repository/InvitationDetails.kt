package dev.groupplanning.android.data.repository

import dev.groupplanning.android.data.api.models.InvitationPreview
import dev.groupplanning.android.data.api.models.Meeting

internal data class InvitationDetails(
    val preview: InvitationPreview,
    val meeting: Meeting? = null,
    val organizer: Boolean = false,
) {
    val canAccess: Boolean get() = meeting != null
}

internal fun Meeting.preview(): InvitationPreview = InvitationPreview(
    id, title, startsAt, timezone, place, coverUrl, myRsvp, myRsvpRevision, description,
)
