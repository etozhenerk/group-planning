@file:kotlinx.serialization.UseSerializers(UuidSerializer::class)

package dev.groupplanning.android.data.api.models

import java.util.UUID
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
internal data class RsvpResult(
    @SerialName("meeting_id") val meetingId: UUID,
    val rsvp: RsvpAnswer,
    @SerialName("rsvp_revision") val rsvpRevision: ServerCounter,
    @SerialName("can_access_feed") val canAccessFeed: Boolean,
    @SerialName("meeting_revision") val meetingRevision: ServerCounter,
)
