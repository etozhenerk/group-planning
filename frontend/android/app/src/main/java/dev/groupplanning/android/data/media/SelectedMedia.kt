package dev.groupplanning.android.data.media

import dev.groupplanning.android.data.api.models.MeetingMedia
import kotlinx.serialization.Serializable

@Serializable
internal data class SelectedMedia(
    val key: String,
    val publishKey: String,
    val owner: String,
    val meeting: String,
    val fileName: String,
    val contentType: String,
    val size: Long,
    val purpose: String,
    val media: MeetingMedia? = null,
    val published: Boolean = false,
    val sourceUri: String? = null,
    val photoSelection: Boolean = false,
    val caption: String = "",
    val submissionStarted: Boolean = false,
)
