package dev.groupplanning.android.data.repository

import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import dev.groupplanning.android.data.api.OkHttpTransport
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.Request

internal class AvatarRepository {
    suspend fun bytes(value: String): ByteArray {
        val url = value.toHttpUrlOrNull()?.takeIf {
            it.isHttps &&
                it.username.isEmpty() &&
                it.password.isEmpty() &&
                (it.host == "avatars.yandex.net" || it.host == "avatars.mds.yandex.net")
        } ?: throw ClientFailure(FailureKind.InvalidRequest)
        val result = OkHttpTransport().execute(
            Request.Builder().url(url)
                .header(
                    "Accept",
                    "image/jpeg, image/png",
                ).header("Cache-Control", "no-store").build(),
        )
        if (result.status != 200 ||
            result.contentType?.substringBefore(';') !in
            listOf("image/jpeg", "image/png", "image/webp")
        ) {
            throw ClientFailure(FailureKind.InvalidResponse)
        }
        return result.bytes
    }
}
