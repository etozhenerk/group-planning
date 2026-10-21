package dev.groupplanning.android.data.api

import okhttp3.Request

internal class WireResponse(val status: Int, val contentType: String?, val body: String)

internal fun interface HttpTransport {
    suspend fun execute(request: Request): WireResponse
}
