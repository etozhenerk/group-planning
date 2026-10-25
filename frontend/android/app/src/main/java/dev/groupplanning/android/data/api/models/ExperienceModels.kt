@file:kotlinx.serialization.UseSerializers(UuidSerializer::class)

package dev.groupplanning.android.data.api.models

import java.util.UUID
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
internal data class OwnProfile(
    val id: UUID,
    @SerialName("display_name") val displayName: String,
    @SerialName("avatar_url") val avatarUrl: String? = null,
    val email: String? = null,
    val phone: String? = null,
    val provider: String = "yandex",
    val login: String? = null,
    @SerialName("first_name") val firstName: String? = null,
    @SerialName("last_name") val lastName: String? = null,
    val birthday: String? = null,
    val sex: String? = null,
)

@Serializable
internal data class MessageReaction(
    val emoji: String,
    val count: Int,
    val mine: Boolean,
    val users: List<UserProfile> = emptyList(),
)

@Serializable
internal data class EntryReactions(
    @SerialName("entry_id") val entryId: UUID,
    val reactions: List<MessageReaction> = emptyList(),
)

@Serializable
internal data class ReactionsPage(val entries: List<EntryReactions>)

@Serializable
internal data class MeetingMedia(
    val id: UUID,
    @SerialName("meeting_id") val meetingId: UUID,
    @SerialName("file_name") val fileName: String,
    @SerialName("content_type") val contentType: String,
    @SerialName("size_bytes") val sizeBytes: Long,
    val kind: String,
    val purpose: String,
    val status: String,
    @SerialName("download_url") val downloadUrl: String? = null,
    @SerialName("thumbnail_url") val thumbnailUrl: String? = null,
    @SerialName("created_at") val createdAt: ApiInstant,
    @SerialName("uploaded_by") val uploadedBy: UserProfile,
)

@Serializable
internal data class MediaEnvelope(val media: MeetingMedia, val entry: FeedEntry? = null)

@Serializable
internal data class MediaLimits(
    @SerialName("max_photo_bytes") val maxPhotoBytes: Long,
    @SerialName("max_file_bytes") val maxFileBytes: Long,
    @SerialName("max_files") val maxFiles: Int,
    @SerialName("photo_types") val photoTypes: List<String>,
    @SerialName("file_types") val fileTypes: List<String>,
)

@Serializable
internal data class MemoriesPage(
    val photos: List<MeetingMedia>,
    @SerialName("next_cursor") val nextCursor: String? = null,
)

@Serializable
internal data class FeedbackReceipt(val id: UUID, val reference: String, val status: String)
