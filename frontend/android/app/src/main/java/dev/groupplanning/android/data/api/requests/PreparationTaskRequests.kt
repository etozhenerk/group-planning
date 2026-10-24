package dev.groupplanning.android.data.api.requests

import dev.groupplanning.android.data.api.ApiRequest
import dev.groupplanning.android.data.api.models.PreparationAction
import dev.groupplanning.android.data.api.models.PreparationTask
import java.util.UUID
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive

internal object PreparationTaskRequests {
    private fun path(meeting: UUID, task: UUID? = null): List<String> =
        listOf("meetings", meeting.toString(), "preparation-tasks") +
            listOfNotNull(task?.toString())

    fun read(meeting: UUID, task: UUID): ApiRequest =
        ApiRequest(path(meeting, task), meetingId = meeting, revokesAccessOnForbidden = true)

    fun create(meeting: UUID, title: String, recipient: UUID?): ApiRequest = ApiRequest(
        path(meeting),
        method = "POST",
        body = JsonObject(
            mapOf(
                "title" to JsonPrimitive(title),
                "recipient_id" to (
                    recipient?.let {
                        JsonPrimitive(it.toString())
                    } ?: JsonNull
                    ),
            ),
        ).toString(),
        key = UUID.randomUUID(),
        expectedStatus = 201,
        meetingId = meeting,
        revokesAccessOnForbidden = true,
    )

    fun act(task: PreparationTask, action: PreparationAction): ApiRequest = ApiRequest(
        path(task.meetingId, task.id) + action.path,
        method = "POST",
        body = JsonObject(
            mapOf("expected_revision" to JsonPrimitive(task.revision.value)),
        ).toString(),
        key = UUID.randomUUID(),
        meetingId = task.meetingId,
        revokesAccessOnForbidden = true,
    )
}
