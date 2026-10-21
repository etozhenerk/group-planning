package dev.groupplanning.android.data.api.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
internal data class Participant(
    val user: UserProfile,
    val role: String,
    val rsvp: RsvpAnswer?,
    @SerialName("rsvp_revision") val rsvpRevision: ServerCounter,
)
