package dev.groupplanning.android.state

import dev.groupplanning.android.data.api.models.RsvpAnswer
import dev.groupplanning.android.data.api.models.RsvpRequest
import dev.groupplanning.android.data.repository.InvitationDetails
import java.util.UUID

internal enum class InvitationIssue { Load, Unavailable, Unconfirmed, Conflict, Rejected, Share }

internal data class RsvpSubmission(val input: RsvpRequest, val key: UUID = UUID.randomUUID())

internal data class InvitationState(
    val details: InvitationDetails? = null,
    val profileId: UUID? = null,
    val choice: RsvpAnswer? = null,
    val loading: Boolean = false,
    val saving: Boolean = false,
    val issue: InvitationIssue? = null,
    val pending: RsvpSubmission? = null,
    val shareUrl: String? = null,
) {
    val answer: RsvpAnswer? get() = details?.preview?.myRsvp
    val editable: Boolean get() = !loading &&
        !saving &&
        pending == null &&
        details?.organizer != true
    val canSave: Boolean get() = editable && choice != null && choice != answer
}
