package dev.groupplanning.android.data.album

import dev.groupplanning.android.data.api.models.MeetingMedia
import java.util.UUID

internal data class AlbumPhoto(val id: UUID, val contentType: String, val size: Long) {
    val fileName: String
        get() = "$id." + when (contentType) {
            "image/jpeg" -> "jpg"
            "image/png" -> "png"
            "image/webp" -> "webp"
            else -> throw AlbumSaveFailure(AlbumSaveIssue.InvalidSnapshot)
        }

    companion object {
        fun snapshot(meeting: UUID, items: List<MeetingMedia>): List<AlbumPhoto> {
            if (items.isEmpty()) throw AlbumSaveFailure(AlbumSaveIssue.Empty)
            val seen = mutableSetOf<UUID>()
            var total = 0L
            return items.map {
                if (it.meetingId != meeting ||
                    it.purpose != "memory" ||
                    it.kind != "photo" ||
                    it.status != "published" ||
                    !seen.add(it.id) ||
                    it.contentType !in setOf("image/jpeg", "image/png", "image/webp") ||
                    it.sizeBytes !in 1..10L * 1024 * 1024
                ) {
                    throw AlbumSaveFailure(AlbumSaveIssue.InvalidSnapshot)
                }
                total += it.sizeBytes
                if (total > 1024L * 1024 * 1024) {
                    throw AlbumSaveFailure(AlbumSaveIssue.InvalidSnapshot)
                }
                AlbumPhoto(it.id, it.contentType, it.sizeBytes)
            }
        }
    }
}
