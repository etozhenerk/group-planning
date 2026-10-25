package dev.groupplanning.android.data.api.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
internal data class PreparedCover(@SerialName("media_type") val mediaType: String, val data: String)
