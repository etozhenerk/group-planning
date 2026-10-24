package dev.groupplanning.android.data.api.requests

import dev.groupplanning.android.data.api.ApiRequest
import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.DatePoll
import dev.groupplanning.android.data.api.models.DatePollSettings
import java.util.UUID
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

internal object DatePollRequests {
    private fun path(meeting: UUID): List<String> =
        listOf("meetings", meeting.toString(), "date-polls")

    fun read(meeting: UUID, poll: UUID): ApiRequest = ApiRequest(
        path(meeting) + poll.toString(),
        meetingId = meeting,
        revokesAccessOnForbidden = true,
    )

    fun create(
        meeting: UUID,
        dates: List<String>,
        deadline: String,
        settings: DatePollSettings,
    ): ApiRequest = ApiRequest(
        path(meeting),
        method = "POST",
        key = UUID.randomUUID(),
        expectedStatus = 201,
        meetingId = meeting,
        revokesAccessOnForbidden = true,
        body = buildJsonObject {
            put("dates", apiJson.parseToJsonElement(apiJson.encodeToString(dates)))
            put("closes_at", deadline)
            put("settings", apiJson.parseToJsonElement(apiJson.encodeToString(settings)))
        }.toString(),
    )

    fun action(poll: DatePoll, kind: String, fields: Map<String, JsonElement>): ApiRequest =
        ApiRequest(
            path(poll.meetingId) + listOf(poll.id.toString(), kind),
            method = if (kind == "vote") "PUT" else "POST",
            key = UUID.randomUUID(),
            meetingId = poll.meetingId,
            revokesAccessOnForbidden = kind != "resolve",
            body = buildJsonObject {
                fields.forEach { (key, value) -> put(key, value) }
                put(
                    "expected_revision",
                    if (kind ==
                        "vote"
                    ) {
                        poll.myVoteRevision.value
                    } else {
                        poll.revision.value
                    },
                )
            }.toString(),
        )
}
