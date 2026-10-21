package dev.groupplanning.android.data.api.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
internal data class MeetingsPage(
    val meetings: List<MeetingSummary>,
    @SerialName("next_cursor") val nextCursor: String?,
)
