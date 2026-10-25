package dev.groupplanning.android.data.api.models

import kotlinx.serialization.EncodeDefault
import kotlinx.serialization.ExperimentalSerializationApi
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
internal data class CreateMeeting(
    val title: String,
    val description: String? = null,
    @SerialName("starts_at") val startsAt: ApiInstant? = null,
    val timezone: String,
    val place: String? = null,
    @OptIn(ExperimentalSerializationApi::class)
    @EncodeDefault(EncodeDefault.Mode.NEVER)
    @SerialName("starts_on") val startsOn: String? = null,
    @OptIn(ExperimentalSerializationApi::class)
    @EncodeDefault(EncodeDefault.Mode.NEVER)
    val cover: PreparedCover? = null,
)
