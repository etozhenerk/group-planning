package dev.groupplanning.android.data.repository

import android.net.Uri
import androidx.core.net.toUri
import dev.groupplanning.android.data.api.ApiRequest
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import dev.groupplanning.android.data.api.models.MediaEnvelope
import dev.groupplanning.android.data.api.models.MediaLimits
import dev.groupplanning.android.data.api.models.MeetingMedia
import dev.groupplanning.android.data.api.models.MemoriesPage
import dev.groupplanning.android.data.media.MediaSelection
import dev.groupplanning.android.data.media.MediaStorage
import dev.groupplanning.android.data.media.SelectedMedia
import dev.groupplanning.android.data.session.MeetingAccess
import dev.groupplanning.android.data.session.SessionRepository
import java.io.IOException
import java.util.UUID
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

internal class MediaRepository(
    val sessions: SessionRepository,
    private val storage: MediaStorage,
    private val selection: MediaSelection,
) {
    private fun request(
        access: MeetingAccess,
        suffix: List<String>,
        method: String = "GET",
        body: String? = null,
        key: UUID? = null,
        status: Int = 200,
    ): ApiRequest = ApiRequest(
        listOf("meetings", access.id.toString()) + suffix,
        method,
        body,
        key,
        status,
        meetingId = access.id,
        revokesAccessOnForbidden = true,
    )

    suspend fun limits(access: MeetingAccess): MediaLimits = sessions.authenticated(
        request(access, listOf("media", "limits")),
        MediaLimits.serializer(),
        expectedLease = access.request,
    )

    suspend fun records(access: MeetingAccess): List<SelectedMedia> = sessions.withAccess(access) {
        withContext(Dispatchers.IO) {
            storage.records(access.profile.id.toString(), access.id.toString())
        }
    }

    suspend fun select(
        access: MeetingAccess,
        uri: Uri,
        purpose: String,
        photo: Boolean,
        limits: MediaLimits,
    ): SelectedMedia {
        val (name, type) = selection.describe(uri)
        val queued = SelectedMedia(
            UUID.randomUUID().toString(), UUID.randomUUID().toString(),
            access.profile.id.toString(), access.id.toString(), name, type, 0, purpose,
            sourceUri = uri.toString(), photoSelection = photo,
        )
        persist(access, queued)
        return try {
            prepare(access, queued, limits)
        } catch (
            _: IOException,
        ) {
            queued
        } catch (error: ClientFailure) {
            if (error.kind == FailureKind.InvalidRequest) queued else throw error
        }
    }

    private suspend fun prepare(
        access: MeetingAccess,
        item: SelectedMedia,
        limits: MediaLimits,
    ): SelectedMedia {
        val source = item.sourceUri ?: return item
        val input = selection.read(
            source.toUri(),
            if (item.photoSelection) limits.maxPhotoBytes else limits.maxFileBytes,
            item.photoSelection,
        )
        val allowed = if (item.photoSelection) limits.photoTypes else limits.fileTypes
        if (input.type !in allowed) throw ClientFailure(FailureKind.InvalidRequest)
        val prepared = item.copy(
            fileName = input.name,
            contentType = input.type,
            size = input.bytes.size.toLong(),
            sourceUri = null,
        )
        sessions.withAccess(access) {
            withContext(Dispatchers.IO) { storage.save(prepared, input.bytes) }
        }
        return prepared
    }

    suspend fun remove(access: MeetingAccess, item: SelectedMedia) = sessions.withAccess(access) {
        withContext(Dispatchers.IO) { storage.remove(item) }
    }

    suspend fun local(access: MeetingAccess, item: SelectedMedia): ByteArray =
        sessions.withAccess(access) { withContext(Dispatchers.IO) { storage.bytes(item) } }

    suspend fun send(
        access: MeetingAccess,
        selected: SelectedMedia,
        update: (SelectedMedia) -> Unit,
    ): SelectedMedia {
        if (selected.published) return selected
        var item = if (selected.sourceUri !=
            null
        ) {
            prepare(access, selected, limits(access))
        } else {
            selected
        }
        item = item.copy(submissionStarted = true)
        persist(access, item)
        update(item)
        if (item.media == null) {
            val body = buildJsonObject {
                put("client_request_id", item.key)
                put("file_name", item.fileName)
                put("content_type", item.contentType)
                put("size_bytes", item.size)
                put("purpose", item.purpose)
            }.toString()
            val result = sessions.authenticated(
                request(
                    access,
                    listOf("media", "uploads"),
                    "POST",
                    body,
                    UUID.fromString(item.key),
                    201,
                ),
                MediaEnvelope.serializer(),
                expectedLease = access.request,
            )
            if (result.media.meetingId != access.id || result.media.purpose != item.purpose) {
                throw ClientFailure(FailureKind.InvalidResponse)
            }
            item = item.copy(media = result.media)
            persist(access, item)
            update(item)
        }
        val media = checkNotNull(item.media)
        if (media.meetingId != access.id) throw ClientFailure(FailureKind.InvalidResponse)
        sessions.authenticated(
            ApiRequest(
                listOf("meetings", access.id.toString(), "media", media.id.toString(), "content"),
                "PUT",
                binary = local(access, item),
                contentType = item.contentType,
                meetingId = access.id,
                revokesAccessOnForbidden = true,
            ),
            MediaEnvelope.serializer(),
            expectedLease = access.request,
        )
        val published = sessions.authenticated(
            request(
                access,
                listOf("media", media.id.toString(), "publish"),
                "POST",
                buildJsonObject {
                    if (!item.contentType.startsWith("image/")) put("caption", item.caption)
                }.toString(),
                UUID.fromString(item.publishKey),
            ),
            MediaEnvelope.serializer(),
            expectedLease = access.request,
        )
        if (published.media.id != media.id ||
            published.media.meetingId != access.id ||
            published.media.status != "published"
        ) {
            throw ClientFailure(FailureKind.InvalidResponse)
        }
        item = item.copy(media = published.media, published = true)
        persist(access, item)
        return item
    }

    suspend fun persist(access: MeetingAccess, item: SelectedMedia) = sessions.withAccess(access) {
        withContext(Dispatchers.IO) { storage.save(item) }
    }

    suspend fun content(access: MeetingAccess, media: MeetingMedia): ByteArray {
        if (media.meetingId != access.id) throw ClientFailure(FailureKind.InvalidResponse)
        return sessions.content(
            request(access, listOf("media", media.id.toString(), "content")),
            access.request,
        )
    }

    suspend fun export(access: MeetingAccess, media: MeetingMedia, destination: Uri) {
        val bytes = content(access, media)
        sessions.withAccess(access) { selection.write(destination, bytes) }
    }

    suspend fun memories(access: MeetingAccess, cursor: String? = null): MemoriesPage =
        sessions.authenticated(
            ApiRequest(
                listOf("meetings", access.id.toString(), "memories"),
                query = buildMap {
                    put("limit", "50")
                    cursor?.let { put("cursor", it) }
                },
                meetingId = access.id,
                revokesAccessOnForbidden = true,
            ),
            MemoriesPage.serializer(),
            expectedLease = access.request,
        )
}
