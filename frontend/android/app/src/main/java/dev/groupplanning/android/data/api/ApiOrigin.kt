package dev.groupplanning.android.data.api

import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull

internal class ApiOrigin(value: String) {
    val url: HttpUrl = value.toHttpUrlOrNull()?.takeIf {
        it.isHttps &&
            it.username.isEmpty() &&
            it.password.isEmpty() &&
            it.encodedPath == "/" &&
            it.query == null &&
            it.fragment == null
    } ?: throw ClientFailure(FailureKind.InvalidOrigin)

    fun resolve(request: ApiRequest): HttpUrl {
        if (request.path.isEmpty() || request.path.any { !it.matches(Regex("[A-Za-z0-9_-]+")) }) {
            throw ClientFailure(FailureKind.InvalidRequest)
        }
        return url.newBuilder().addPathSegments("api/v1").apply {
            request.path.forEach { addPathSegment(it) }
            request.query.forEach { (name, value) -> addQueryParameter(name, value) }
        }.build()
    }
}
