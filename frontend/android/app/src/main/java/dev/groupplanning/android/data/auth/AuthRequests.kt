package dev.groupplanning.android.data.auth

import dev.groupplanning.android.data.api.ApiRequest
import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.ApiInstant
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString

internal object AuthRequests {
    fun start(context: AuthContext, challenge: String): ApiRequest = ApiRequest(
        listOf("auth", "yandex", "start"),
        "POST",
        apiJson.encodeToString(Start(context, challenge)),
    )
    fun exchange(attempt: PendingAuthAttempt, token: String): ApiRequest = ApiRequest(
        listOf("auth", "mobile", "sdk", "exchange"),
        "POST",
        apiJson.encodeToString(Exchange(attempt.id, token, attempt.verifier)),
    )

    @Serializable
    private class Start(
        @SerialName("return_context") val context: AuthContext,
        @SerialName("app_challenge") val challenge: String,
        @SerialName("client_kind") val kind: String = "android",
    )

    @Serializable
    private class Exchange(
        @SerialName("attempt_id") val id: String,
        @SerialName("oauth_token") val token: String,
        @SerialName("app_verifier") val verifier: String,
    )

    @Serializable
    class Started(
        @SerialName("attempt_id") val id: String,
        @SerialName("authorization_url") val url: String,
        @SerialName("expires_at") val expiresAt: ApiInstant,
    )

    @Serializable
    class Session(
        @SerialName("session_token") val token: String,
        @SerialName("expires_at") val expiresAt: ApiInstant,
        @SerialName("return_context") val context: AuthContext,
    )
}
