package dev.groupplanning.android.data.api.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
internal data class MemorySnapshot(
    val photos: List<MeetingMedia>,
    @SerialName("next_cursor") val nextCursor: String?,
)
