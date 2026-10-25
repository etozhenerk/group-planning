@file:kotlinx.serialization.UseSerializers(UuidSerializer::class)

package dev.groupplanning.android.data.api.models

import java.util.UUID
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
internal data class InvitationPreview(
    @SerialName("meeting_id") val meetingId: UUID,
    val title: String,
    @SerialName("starts_at") val startsAt: ApiInstant?,
    val timezone: String,
    val place: String?,
    @SerialName("cover_url") val coverUrl: String?,
    @SerialName("my_rsvp") val myRsvp: RsvpAnswer?,
    @SerialName("my_rsvp_revision") val myRsvpRevision: ServerCounter,
    val description: String? = null,
    @SerialName("starts_on") val startsOn: String? = null,
    @SerialName("join_closes_at") val joinClosesAt: ApiInstant? = null,
    @SerialName("can_join") val canJoin: Boolean = true,
    @SerialName("join_disabled_reason") val joinDisabledReason: String? = null,
    val organizer: UserProfile? = null,
) {
    fun canJoinAt(now: java.time.Instant): Boolean {
        if (myRsvp == RsvpAnswer.Going) return true
        if (!canJoin) return false
        val boundary = joinClosesAt?.instant ?: startsAt?.instant?.minusSeconds(3600)
        return boundary == null || now.isBefore(boundary)
    }
}
