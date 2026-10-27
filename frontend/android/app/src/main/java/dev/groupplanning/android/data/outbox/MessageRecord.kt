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
    val status: DeliveryStatus = if (rejected) DeliveryStatus.Rejected else DeliveryStatus.Queued,
)

@Serializable
internal data class MessageRecord(
    val owner: UUID,
    val meeting: UUID,
    val draft: String = "",
    val pending: PendingMessage? = null,
    val queue: List<PendingMessage> = emptyList(),
)

@Serializable
internal enum class DeliveryStatus { Queued, Sending, Uncertain, Rejected }

internal fun MessageRecord.normalized(): MessageRecord = copy(
    pending = null,
    queue = if (queue.isEmpty()) listOfNotNull(pending) else queue,
)

internal interface MessageStorage {
    fun load(): List<MessageRecord>
    fun save(records: List<MessageRecord>)
}
