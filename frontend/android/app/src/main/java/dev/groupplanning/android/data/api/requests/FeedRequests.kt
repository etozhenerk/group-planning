package dev.groupplanning.android.data.api.requests

import dev.groupplanning.android.data.api.ApiRequest
import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.MessageRequest
import dev.groupplanning.android.data.api.models.ServerCounter
import java.util.UUID
import kotlinx.serialization.encodeToString

internal object FeedRequests {
    fun page(
        id: UUID,
        after: ServerCounter? = null,
        before: ServerCounter? = null,
        limit: Int = 50,
        around: UUID? = null,
    ): ApiRequest {
        require(listOfNotNull(after, before, around).size <= 1)
        require(limit in 1..100)
        return ApiRequest(
            path = listOf("meetings", id.toString(), "feed"),
            query = buildMap {
                put("limit", limit.toString())
                after?.let { put("after_sequence", it.value) }
                before?.let { put("before_sequence", it.value) }
                around?.let { put("around_entry_id", it.toString()) }
            },
            meetingId = id,
            revokesAccessOnForbidden = true,
        )
    }

    fun message(id: UUID, text: String, key: UUID): ApiRequest = ApiRequest(
        path = listOf("meetings", id.toString(), "messages"),
        method = "POST",
        body = apiJson.encodeToString(MessageRequest(text, key)),
        key = key,
        expectedStatus = 201,
        meetingId = id,
        revokesAccessOnForbidden = true,
    )
}
