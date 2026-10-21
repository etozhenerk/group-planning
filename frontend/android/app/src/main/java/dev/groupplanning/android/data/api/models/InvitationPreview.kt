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
)
