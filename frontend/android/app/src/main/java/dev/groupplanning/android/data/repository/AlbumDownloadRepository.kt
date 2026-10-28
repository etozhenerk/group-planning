package dev.groupplanning.android.data.repository

import dev.groupplanning.android.data.album.AlbumGallery
import dev.groupplanning.android.data.album.AlbumGalleryOperation
import dev.groupplanning.android.data.album.AlbumPhoto
import dev.groupplanning.android.data.album.AlbumSaveFailure
import dev.groupplanning.android.data.album.AlbumSaveIssue
import dev.groupplanning.android.data.album.AlbumTemporaryFiles
import dev.groupplanning.android.data.api.ApiRequest
import dev.groupplanning.android.data.api.models.Meeting
import dev.groupplanning.android.data.api.models.MemorySnapshot
import dev.groupplanning.android.data.api.requests.MeetingRequests
import dev.groupplanning.android.data.session.MeetingAccess
import dev.groupplanning.android.data.session.SessionRepository
import java.io.File
import java.io.IOException
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.withContext

internal class AlbumDownloadRepository(
    private val sessions: SessionRepository,
    private val gallery: AlbumGallery,
    temporaryRoot: File,
    private val io: CoroutineDispatcher = Dispatchers.IO,
) {
    private val temporary = AlbumTemporaryFiles(temporaryRoot)

    suspend fun save(access: MeetingAccess, publishing: () -> Unit = {}): Int {
        if (!active.tryLock()) throw AlbumSaveFailure(AlbumSaveIssue.Busy)
        try {
            gallery.requirePermission()
            return sessions.meetingOperation(access) {
                withContext(io) { prepareAndSave(access, publishing) }
            }
        } catch (error: SecurityException) {
            throw AlbumSaveFailure(AlbumSaveIssue.PermissionRequired).apply { initCause(error) }
        } catch (error: IOException) {
            throw AlbumSaveFailure(AlbumSaveIssue.Storage).apply { initCause(error) }
        } finally {
            active.unlock()
        }
    }

    private suspend fun prepareAndSave(access: MeetingAccess, publishing: () -> Unit): Int {
        temporary.removeAbandoned()
        val page = sessions.authenticated(
            request(access, listOf("memories", "snapshot")),
            MemorySnapshot.serializer(),
            expectedLease = access.request,
        )
        if (page.nextCursor != null) throw AlbumSaveFailure(AlbumSaveIssue.InvalidSnapshot)
        val photos = AlbumPhoto.snapshot(access.id, page.photos)
        val folder = temporary.create()
        var operation: AlbumGalleryOperation? = null
        var completed = false
        var failure: Throwable? = null
        try {
            // Only one original is held in memory; nothing enters the gallery during downloads.
            for (photo in photos) {
                val bytes = sessions.content(
                    request(access, listOf("media", photo.id.toString(), "content")),
                    access.request,
                )
                if (bytes.size.toLong() != photo.size) {
                    throw AlbumSaveFailure(AlbumSaveIssue.InvalidSnapshot)
                }
                currentCoroutineContext().ensureActive()
                File(folder, photo.fileName).writeBytes(bytes)
            }
            sessions.withAccess(access) { }
            operation = gallery.begin()
            for (photo in photos) {
                operation.stage(photo, File(folder, photo.fileName))
                sessions.withAccess(access) { }
            }
            verify(access)
            currentCoroutineContext().ensureActive()
            // Final system publication is non-cancellable; successful user-owned copies stay saved.
            withContext(NonCancellable) {
                sessions.withAccess(access) {
                    publishing()
                    operation.publish()
                    completed = true
                }
            }
            return photos.size
        } catch (error: Throwable) {
            failure = error
            throw error
        } finally {
            withContext(NonCancellable) {
                try {
                    if (!completed) operation?.discard()
                } catch (cleanup: Exception) {
                    if (failure != null) failure.addSuppressed(cleanup) else throw cleanup
                } finally {
                    try {
                        temporary.remove(folder)
                    } catch (cleanup: IOException) {
                        if (failure != null) failure.addSuppressed(cleanup) else throw cleanup
                    }
                }
            }
        }
    }

    private suspend fun verify(access: MeetingAccess) {
        val meeting = sessions.authenticated(
            MeetingRequests.details(access.id),
            Meeting.serializer(),
            expectedLease = access.request,
        )
        if (meeting.id != access.id) throw AlbumSaveFailure(AlbumSaveIssue.InvalidSnapshot)
    }

    private fun request(access: MeetingAccess, suffix: List<String>) = ApiRequest(
        listOf("meetings", access.id.toString()) + suffix,
        meetingId = access.id,
        revokesAccessOnForbidden = true,
    )

    private companion object {
        // Multiple runtimes must not recover an operation still active in this process.
        val active = Mutex()
    }
}
