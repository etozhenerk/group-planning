@file:kotlinx.serialization.UseSerializers(UuidSerializer::class)

package dev.groupplanning.android.data.api.models

import java.util.UUID
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
internal data class UserProfile(
    val id: UUID,
    @SerialName("display_name") val displayName: String,
    @SerialName("avatar_url") val avatarUrl: String? = null,
)
