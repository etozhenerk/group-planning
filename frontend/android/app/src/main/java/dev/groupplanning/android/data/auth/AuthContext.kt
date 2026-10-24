package dev.groupplanning.android.data.auth

import kotlinx.serialization.EncodeDefault
import kotlinx.serialization.ExperimentalSerializationApi
import kotlinx.serialization.Serializable

@OptIn(ExperimentalSerializationApi::class)
@Serializable
internal data class AuthContext(
    val kind: String = "home",
    @EncodeDefault(EncodeDefault.Mode.NEVER) val token: String? = null,
) {
    init {
        require(
            (kind == "home" && token == null) ||
                (
                    kind == "invitation" &&
                        token != null &&
                        token.matches(Regex("[A-Za-z0-9_-]{22}|[A-Za-z0-9_-]{43}"))
                    ),
        )
    }
    override fun toString(): String = "AuthContext($kind)"
}
