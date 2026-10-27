@file:kotlinx.serialization.UseSerializers(UuidSerializer::class)

package dev.groupplanning.android.data.api.models

import java.util.UUID
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

internal data class ChatReadInfo(
    val actual: ServerCounter,
    val baseline: ServerCounter,
    val unread: ServerCounter,
    val firstUnread: UUID?,
)

@Serializable
internal data class ChatReadState(
    @SerialName("read_through_sequence") val actual: ServerCounter,
    @SerialName("unread_baseline_sequence") val baseline: ServerCounter,
    @SerialName("unread_count") val unread: ServerCounter,
    @SerialName("first_unread") val firstUnread: UUID?,
    @SerialName("projection_version") val version: ServerCounter,
) {
    val info get() = ChatReadInfo(actual, baseline, unread, firstUnread)
}

@Serializable
internal data class ChatReceipt(
    @SerialName("entry_id") val entry: UUID,
    @SerialName("reader_count") val count: ServerCounter,
)

@Serializable
internal data class ChatReadReceipts(
    val receipts: List<ChatReceipt>,
    @SerialName("projection_version") val version: ServerCounter,
)

@Serializable
internal data class ChatMessageReaders(
    val readers: List<UserProfile>,
    @SerialName("reader_count") val count: ServerCounter,
    @SerialName("next_cursor") val cursor: String?,
    @SerialName("projection_version") val version: ServerCounter,
)
