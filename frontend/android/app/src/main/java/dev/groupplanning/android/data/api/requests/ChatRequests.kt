package dev.groupplanning.android.data.api.requests

import dev.groupplanning.android.data.api.ApiRequest
import java.util.UUID

internal object ChatRequests {
    val capabilities = ApiRequest(listOf("chat-capabilities"))

    fun sync(id: UUID, cursor: String? = null, around: UUID? = null): ApiRequest {
        require(cursor == null || around == null)
        return ApiRequest(
            listOf("meetings", id.toString(), "sync"),
            query = buildMap {
                put("limit", if (cursor == null) "50" else "100")
                cursor?.let { put("cursor", it) }
                around?.let { put("around_entry_id", it.toString()) }
            },
            meetingId = id,
            revokesAccessOnForbidden = true,
        )
    }
}
