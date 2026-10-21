package dev.groupplanning.android.data.api

import dev.groupplanning.android.data.api.models.ApiErrorEnvelope
import dev.groupplanning.android.data.session.StoredSession
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.ensureActive
import kotlinx.serialization.DeserializationStrategy
import kotlinx.serialization.SerializationException
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

internal class ApiClient(
    val origin: ApiOrigin,
    private val transport: HttpTransport = OkHttpTransport(),
) {
    suspend fun <T> send(
        request: ApiRequest,
        serializer: DeserializationStrategy<T>,
        credential: StoredSession? = null,
    ): T {
        val body = load(request, credential)
        return try {
            apiJson.decodeFromString(serializer, body)
        } catch (_: SerializationException) {
            throw ClientFailure(FailureKind.InvalidResponse)
        } catch (_: IllegalArgumentException) {
            throw ClientFailure(FailureKind.InvalidResponse)
        }
    }

    suspend fun sendEmpty(request: ApiRequest, credential: StoredSession? = null) {
        load(request, credential)
    }

    private suspend fun load(request: ApiRequest, credential: StoredSession?): String {
        currentCoroutineContext().ensureActive()
        val wire = Request.Builder().url(origin.resolve(request))
            .header("Accept", "application/json")
            .header("Cache-Control", "no-store")
        val body = if (request.method in setOf("POST", "PUT", "PATCH")) {
            request.body.orEmpty().toRequestBody("application/json".toMediaType())
        } else {
            null
        }
        wire.method(request.method, body)
        credential?.let { wire.header("Authorization", "Bearer " + it.token) }
        request.key?.let { wire.header("Idempotency-Key", it.toString()) }
        val response = transport.execute(wire.build())
        currentCoroutineContext().ensureActive()
        if (response.status != request.expectedStatus) {
            val problem = try {
                apiJson.decodeFromString<ApiErrorEnvelope>(response.body).error
            } catch (_: SerializationException) {
                null
            } catch (_: IllegalArgumentException) {
                null
            }
            throw ClientFailure(FailureKind.Http, response.status, problem)
        }
        if (response.status != 204 &&
            response.contentType?.substringBefore(';')?.trim()?.lowercase() != "application/json"
        ) {
            throw ClientFailure(FailureKind.InvalidResponse)
        }
        return response.body
    }
}
