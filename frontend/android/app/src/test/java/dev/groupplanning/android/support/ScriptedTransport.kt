package dev.groupplanning.android.support

import dev.groupplanning.android.data.api.HttpTransport
import dev.groupplanning.android.data.api.WireResponse
import java.util.ArrayDeque
import okhttp3.Request

internal class ScriptedTransport : HttpTransport {
    private val handlers = mutableMapOf<String, ArrayDeque<suspend () -> WireResponse>>()
    val requests = mutableListOf<Request>()

    fun enqueue(
        path: String,
        body: String = "",
        status: Int = 200,
        mime: String = "application/json",
    ) {
        handle(path) { WireResponse(status, mime, body) }
    }

    fun handle(path: String, response: suspend () -> WireResponse) {
        handlers.getOrPut("/api/v1/$path") { ArrayDeque() }.addLast(response)
    }

    override suspend fun execute(request: Request): WireResponse {
        requests.add(request)
        return checkNotNull(handlers[request.url.encodedPath]?.pollFirst()) {
            "Missing test response for " + request.url.encodedPath
        }.invoke()
    }
}
