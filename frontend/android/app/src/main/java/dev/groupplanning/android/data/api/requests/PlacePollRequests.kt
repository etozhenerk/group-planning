package dev.groupplanning.android.data.api.requests

import dev.groupplanning.android.data.api.ApiRequest
import dev.groupplanning.android.data.api.models.PlacePoll
import java.util.UUID
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive

internal object PlacePollRequests {
    private fun path(meeting: UUID, poll: UUID? = null): List<String> =
        listOf("meetings", meeting.toString(), "place-polls") + listOfNotNull(poll?.toString())

    fun read(meeting: UUID, poll: UUID): ApiRequest =
        ApiRequest(path(meeting, poll), meetingId = meeting, revokesAccessOnForbidden = true)

    fun create(
        meeting: UUID,
        place: String,
        deadline: String,
        explanation: String = "",
    ): ApiRequest = ApiRequest(
        path(meeting),
        method = "POST",
        body = JsonObject(
            mapOf(
                "place" to JsonPrimitive(place),
                "explanation" to JsonPrimitive(explanation),
                "closes_at" to JsonPrimitive(deadline),
            ),
        ).toString(),
        key = UUID.randomUUID(),
        expectedStatus = 201,
        meetingId = meeting,
        revokesAccessOnForbidden = true,
    )

    fun vote(poll: PlacePoll, answer: String): ApiRequest = ApiRequest(
        path(poll.meetingId, poll.id) + "vote",
        method = "PUT",
        body = JsonObject(
            mapOf(
                "answer" to JsonPrimitive(answer),
                "expected_revision" to JsonPrimitive(poll.myVoteRevision.value),
            ),
        ).toString(),
        key = UUID.randomUUID(),
        meetingId = poll.meetingId,
        revokesAccessOnForbidden = true,
    )
}
