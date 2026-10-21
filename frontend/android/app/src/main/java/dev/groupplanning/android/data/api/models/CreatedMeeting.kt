package dev.groupplanning.android.data.api.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
internal data class CreatedMeeting(
    val meeting: Meeting,
    val role: String,
    @SerialName("invitation_url") val invitationUrl: String,
)
