@file:kotlinx.serialization.UseSerializers(UuidSerializer::class)

package dev.groupplanning.android.data.api.models

import java.util.UUID
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
internal data class PreparationTask(
    val id: UUID,
    @SerialName("meeting_id") val meetingId: UUID,
    val title: String,
    val author: UserProfile,
    val recipient: UserProfile?,
    val assignee: UserProfile?,
    @SerialName("updated_by") val updatedBy: UserProfile,
    val state: String,
    val revision: ServerCounter,
    @SerialName("created_at") val createdAt: ApiInstant,
    @SerialName("updated_at") val updatedAt: ApiInstant,
    @SerialName("can_accept") val canAccept: Boolean,
    @SerialName("can_decline") val canDecline: Boolean,
    @SerialName("can_cancel") val canCancel: Boolean,
    @SerialName("can_complete") val canComplete: Boolean,
)
