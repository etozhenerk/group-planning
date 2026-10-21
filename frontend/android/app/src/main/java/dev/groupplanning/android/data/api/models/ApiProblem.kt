@file:kotlinx.serialization.UseSerializers(UuidSerializer::class)

package dev.groupplanning.android.data.api.models

import java.util.UUID
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
internal data class ApiProblem(
    val code: String,
    @SerialName("field_errors") val fieldErrors: Map<String, String>,
    @SerialName("request_id") val requestId: UUID,
    @SerialName("current_response") val currentResponse: RsvpSnapshot? = null,
    @SerialName("current_meeting") val currentMeeting: Meeting? = null,
)
