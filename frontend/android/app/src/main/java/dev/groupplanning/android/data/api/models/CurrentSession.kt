package dev.groupplanning.android.data.api.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
internal data class CurrentSession(
    val user: UserProfile,
    @SerialName("expires_at") val expiresAt: ApiInstant,
    @SerialName("csrf_token") val csrfToken: String? = null,
)
