package dev.groupplanning.android.data.session

import dev.groupplanning.android.data.api.models.ApiInstant
import kotlinx.serialization.Serializable

@Serializable
internal class StoredSession(val token: String, val expiresAt: ApiInstant) {
    init {
        require(token.length in 1..4096 && token.matches(Regex("[A-Za-z0-9._~+/=-]+")))
    }

    override fun toString(): String = "StoredSession(redacted)"
}
