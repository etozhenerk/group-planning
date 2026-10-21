@file:kotlinx.serialization.UseSerializers(UuidSerializer::class)

package dev.groupplanning.android.data.api.models

import java.util.UUID
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive

@Serializable
internal data class FeedEntry(
    val id: UUID,
    @SerialName("meeting_id") val meetingId: UUID,
    val sequence: ServerCounter,
    val kind: String,
    @SerialName("payload_version") val payloadVersion: Int,
    val actor: UserProfile,
    @SerialName("occurred_at") val occurredAt: ApiInstant,
    val payload: JsonObject,
    @SerialName("client_request_id") val clientRequestId: UUID?,
) {
    val messageText: String?
        get() = if (kind == "message" && payloadVersion == 1) {
            (payload["text"] as? JsonPrimitive)?.takeIf { it.isString }?.content
        } else {
            null
        }
}
