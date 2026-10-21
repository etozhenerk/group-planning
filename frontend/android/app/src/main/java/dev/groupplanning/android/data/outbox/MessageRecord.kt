@file:kotlinx.serialization.UseSerializers(
    dev.groupplanning.android.data.api.models.UuidSerializer::class,
)

package dev.groupplanning.android.data.outbox

import dev.groupplanning.android.data.api.models.ApiInstant
import java.util.UUID
import kotlinx.serialization.Serializable

@Serializable
internal data class PendingMessage(
    val key: UUID,
    val text: String,
    val createdAt: ApiInstant,
    val rejected: Boolean = false,
)

@Serializable
internal data class MessageRecord(
    val owner: UUID,
    val meeting: UUID,
    val draft: String = "",
    val pending: PendingMessage? = null,
)

internal interface MessageStorage {
    fun load(): List<MessageRecord>
    fun save(records: List<MessageRecord>)
}
