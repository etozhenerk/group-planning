@file:kotlinx.serialization.UseSerializers(
    dev.groupplanning.android.data.api.models.UuidSerializer::class,
)

package dev.groupplanning.android.data.drafts

import dev.groupplanning.android.data.api.models.CreateMeeting
import java.util.UUID
import kotlinx.serialization.Serializable

@Serializable
internal data class DraftRecord(
    val owner: UUID,
    val value: MeetingDraft,
    val requestId: UUID = UUID.randomUUID(),
    val submission: CreateMeeting? = null,
)

internal interface DraftStorage {
    fun load(owner: UUID): DraftRecord?
    fun save(record: DraftRecord)
    fun remove(owner: UUID)
}
