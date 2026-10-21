package dev.groupplanning.android.data.api.requests

import dev.groupplanning.android.data.api.ApiRequest
import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.CreateMeeting
import dev.groupplanning.android.data.api.models.UpdateMeeting
import java.util.UUID
import kotlinx.serialization.encodeToString

internal object MeetingRequests {
    fun list(cursor: String? = null): ApiRequest = ApiRequest(
        path = listOf("meetings"),
        query = cursor?.let { mapOf("cursor" to it) }.orEmpty(),
    )

    fun details(id: UUID): ApiRequest = privateRead(id)

    fun participants(id: UUID): ApiRequest = privateRead(id, "participants")

    fun invitation(id: UUID): ApiRequest = ApiRequest(
        path = listOf("meetings", id.toString(), "invitation"),
        meetingId = id,
    )

    fun create(input: CreateMeeting, key: UUID): ApiRequest = ApiRequest(
        path = listOf("meetings"),
        method = "POST",
        body = apiJson.encodeToString(input),
        key = key,
        expectedStatus = 201,
    )

    fun update(id: UUID, input: UpdateMeeting, key: UUID): ApiRequest = ApiRequest(
        path = listOf("meetings", id.toString()),
        method = "PATCH",
        body = input.json().toString(),
        key = key,
        meetingId = id,
    )

    private fun privateRead(id: UUID, suffix: String? = null): ApiRequest = ApiRequest(
        path = listOfNotNull("meetings", id.toString(), suffix),
        meetingId = id,
        revokesAccessOnForbidden = true,
    )
}
