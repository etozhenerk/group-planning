package dev.groupplanning.android.data.api.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
internal data class CreateMeeting(
    val title: String,
    val description: String?,
    @SerialName("starts_at") val startsAt: ApiInstant,
    val timezone: String,
    val place: String?,
)
