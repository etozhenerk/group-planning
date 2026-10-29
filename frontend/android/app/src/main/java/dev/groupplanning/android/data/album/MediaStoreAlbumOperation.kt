package dev.groupplanning.android.data.album

import android.content.ContentResolver
import android.net.Uri
import android.os.Build
import java.io.File
import java.io.IOException
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.ensureActive

internal class MediaStoreAlbumOperation(
    private val resolver: ContentResolver,
    private val rows: AlbumMediaStoreRows,
    private var record: AlbumPendingRecord,
    private val journal: AlbumPendingLease?,
) : AlbumGalleryOperation {
    private val created = mutableListOf<Uri>()
    private val legacy = mutableListOf<Pair<AlbumPhoto, File>>()
    private var committed = false
    private var closed = false

    override suspend fun stage(photo: AlbumPhoto, file: File) {
        check(!closed)
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            legacy += photo to file
        } else {
            write(photo, file)
        }
    }

    private suspend fun write(photo: AlbumPhoto, file: File) {
        currentCoroutineContext().ensureActive()
        // The operation UUID was durably recorded before any insert. Recovery does not
        // depend on getting this URI back before the process is killed.
        val uri = rows.insert(record, photo)
        created += uri
        val coroutine = currentCoroutineContext()
        resolver.openOutputStream(uri, "w").use { output ->
            if (output == null) throw IOException("MediaStore output unavailable")
            file.inputStream().use { input ->
                val buffer = ByteArray(DEFAULT_BUFFER_SIZE)
                while (true) {
                    coroutine.ensureActive()
                    val count = input.read(buffer)
                    if (count < 0) break
                    output.write(buffer, 0, count)
                }
            }
        }
    }

    override suspend fun publish() {
        check(!closed)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            record = record.copy(phase = AlbumPendingPhase.Publishing)
            journal?.write(record)
            // Binder batches are bounded; publication of the whole album is not atomic.
            for (batch in created.chunked(100)) rows.publish(record, batch)
        } else {
            for ((photo, file) in legacy) write(photo, file)
        }
        // Never roll published personal copies back because private journal cleanup failed.
        committed = true
        var failure: IOException? = null
        try {
            journal?.clear()
        } catch (error: IOException) {
            failure = error
        }
        try {
            close()
        } catch (error: IOException) {
            if (failure == null) failure = error else failure.addSuppressed(error)
        }
        failure?.let {
            throw AlbumSaveFailure(AlbumSaveIssue.SavedCleanupPending, created.size).apply {
                initCause(it)
            }
        }
    }

    override suspend fun discard() {
        if (committed || closed) return
        var failure: Exception? = null
        for (uri in created.toList()) {
            try {
                rows.delete(record, uri, pendingOnly = false)
                created.remove(uri)
            } catch (error: Exception) {
                if (failure == null) failure = error else failure.addSuppressed(error)
            }
        }
        try {
            if (failure == null) {
                // An insert may commit without returning its URI. Check the durable
                // operation identity before removing the only recovery intent.
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) rows.recover(record)
                journal?.clear()
            }
        } catch (error: Exception) {
            failure = error
        }
        try {
            close()
        } catch (error: IOException) {
            if (failure == null) failure = error else failure.addSuppressed(error)
        }
        failure?.let { throw it }
    }

    private fun close() {
        if (closed) return
        closed = true
        journal?.close()
    }
}
