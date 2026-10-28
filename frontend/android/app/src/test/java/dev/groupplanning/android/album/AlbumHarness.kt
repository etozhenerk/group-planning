package dev.groupplanning.android.album

import dev.groupplanning.android.data.album.AlbumGallery
import dev.groupplanning.android.data.album.AlbumGalleryOperation
import dev.groupplanning.android.data.album.AlbumPhoto
import dev.groupplanning.android.data.album.AlbumSaveFailure
import dev.groupplanning.android.data.album.AlbumSaveIssue
import dev.groupplanning.android.data.api.WireResponse
import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.MeetingMedia
import dev.groupplanning.android.data.api.models.MemorySnapshot
import dev.groupplanning.android.data.repository.AlbumDownloadRepository
import dev.groupplanning.android.support.Fixtures
import dev.groupplanning.android.support.SessionHarness
import java.io.File
import java.util.UUID
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.serialization.encodeToString

internal class RecordingGallery :
    AlbumGallery,
    AlbumGalleryOperation {
    var permitted = true
    var began = false
    var published = false
    var discarded = false
    val originals = mutableMapOf<UUID, ByteArray>()
    var onStage: suspend (File) -> Unit = {}
    var onPublish: suspend () -> Unit = {}

    override fun requirePermission() {
        if (!permitted) throw AlbumSaveFailure(AlbumSaveIssue.PermissionRequired)
    }

    override fun begin(): AlbumGalleryOperation {
        began = true
        return this
    }

    override suspend fun stage(photo: AlbumPhoto, file: File) {
        originals[photo.id] = file.readBytes()
        onStage(file)
    }

    override suspend fun publish() {
        onPublish()
        published = true
    }

    override suspend fun discard() {
        discarded = true
        originals.clear()
    }
}

internal class AlbumHarness(val folder: File, dispatcher: CoroutineDispatcher) {
    val session = SessionHarness(dispatcher)
    val gallery = RecordingGallery()
    val repository = AlbumDownloadRepository(session.session, gallery, folder, dispatcher)
    val id = Fixtures.meetingId
    val path = "meetings/$id"
    val bytes = byteArrayOf(0xff.toByte(), 0xd8.toByte(), 1, 0, 6, 0xff.toByte(), 0xd9.toByte())

    fun photos(count: Int) = List(count) {
        MeetingMedia(
            UUID.randomUUID(), id, "../../same.jpg", "image/jpeg", bytes.size.toLong(),
            "photo", "memory", "published", createdAt = Fixtures.expiry,
            uploadedBy = Fixtures.user,
        )
    }

    fun snapshot(photos: List<MeetingMedia>, next: String? = null) {
        session.transport.enqueue(
            "$path/memories/snapshot",
            apiJson.encodeToString(MemorySnapshot(photos, next)),
        )
    }

    fun contents(photos: List<MeetingMedia>) {
        photos.forEach { photo ->
            session.transport.handle("$path/media/${photo.id}/content") {
                WireResponse(200, photo.contentType, bytes = bytes)
            }
        }
    }

    fun verify() {
        session.transport.enqueue(path, apiJson.encodeToString(Fixtures.meeting()))
    }

    suspend fun access() = session.session.meetingAccess(id)
}
