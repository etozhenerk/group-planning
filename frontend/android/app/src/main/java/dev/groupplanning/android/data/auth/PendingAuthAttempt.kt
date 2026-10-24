package dev.groupplanning.android.data.auth

import dev.groupplanning.android.data.api.models.ApiInstant
import kotlinx.serialization.Serializable

@Serializable
internal class PendingAuthAttempt(
    val id: String,
    val verifier: String,
    val expiresAt: ApiInstant,
    val context: AuthContext,
) {
    override fun toString(): String = "PendingAuthAttempt(redacted)"
}
