@file:kotlinx.serialization.UseSerializers(UuidSerializer::class)

package dev.groupplanning.android.data.api.models

import java.util.UUID
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
internal data class MeetingSummary(
    val id: UUID,
    val title: String,
    @SerialName("starts_at") val startsAt: ApiInstant?,
    val timezone: String,
    val place: String?,
    @SerialName("cover_url") val coverUrl: String?,
    @SerialName("participant_count") val participantCount: Int,
    val revision: ServerCounter,
    @SerialName("my_rsvp") val myRsvp: RsvpAnswer?,
    @SerialName("my_rsvp_revision") val myRsvpRevision: ServerCounter,
    @SerialName("local_date") val localDate: String? = null,
    val period: MeetingPeriod? = null,
)
