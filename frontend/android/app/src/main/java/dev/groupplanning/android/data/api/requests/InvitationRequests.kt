package dev.groupplanning.android.data.api.requests

import dev.groupplanning.android.data.api.ApiRequest
import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.RsvpRequest
import java.util.UUID
import kotlinx.serialization.encodeToString

internal object InvitationRequests {
    fun preview(token: String): ApiRequest = ApiRequest(path = tokenPath(token))

    fun respond(token: String, input: RsvpRequest, key: UUID): ApiRequest = ApiRequest(
        path = tokenPath(token) + "rsvp",
        method = "PUT",
        body = apiJson.encodeToString(input),
        key = key,
    )

    fun respond(id: UUID, input: RsvpRequest, key: UUID): ApiRequest = ApiRequest(
        path = listOf("meetings", id.toString(), "rsvp"),
        method = "PUT",
        body = apiJson.encodeToString(input),
        key = key,
    )

    private fun tokenPath(token: String): List<String> {
        require(token.matches(Regex("[A-Za-z0-9_-]{22}|[A-Za-z0-9_-]{43}")))
        return listOf("invitations", token)
    }
}
