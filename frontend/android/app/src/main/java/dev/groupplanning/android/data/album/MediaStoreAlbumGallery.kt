package dev.groupplanning.android.data.album

import android.Manifest
import android.content.ContentProviderOperation
import android.content.ContentResolver
import android.content.ContentValues
import android.content.Context
import android.content.OperationApplicationException
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.os.RemoteException
import android.provider.MediaStore
import java.io.File
import java.io.IOException
import java.util.UUID
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.ensureActive

internal class MediaStoreAlbumGallery(private val context: Context) : AlbumGallery {
    override fun requirePermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q &&
            context.checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) !=
            PackageManager.PERMISSION_GRANTED
        ) {
            throw AlbumSaveFailure(AlbumSaveIssue.PermissionRequired)
        }
    }

    override fun begin(): AlbumGalleryOperation {
        requirePermission()
        return MediaStoreAlbumOperation(context.contentResolver)
    }
}

private class MediaStoreAlbumOperation(private val resolver: ContentResolver) :
    AlbumGalleryOperation {
    private val owner = UUID.randomUUID()
    private val created = mutableListOf<Uri>()
    private val legacy = mutableListOf<Pair<AlbumPhoto, File>>()

    override suspend fun stage(photo: AlbumPhoto, file: File) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            legacy += photo to file
            return
        }
        write(photo, file)
    }

    private suspend fun write(photo: AlbumPhoto, file: File) {
        currentCoroutineContext().ensureActive()
        val values = ContentValues().apply {
            put(MediaStore.Images.Media.DISPLAY_NAME, "somewhere-$owner-${photo.fileName}")
            put(MediaStore.Images.Media.MIME_TYPE, photo.contentType)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                put(
                    MediaStore.Images.Media.RELATIVE_PATH,
                    "${Environment.DIRECTORY_PICTURES}/somewhere",
                )
                put(MediaStore.Images.Media.IS_PENDING, 1)
            }
        }
        val uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values)
            ?: throw IOException("MediaStore insert failed")
        // Retain ownership before any cancellable work; rollback never queries other photos.
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
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // Bound Binder payloads. Every file is complete before the first publication.
            for (batch in created.chunked(100)) {
                val updates = ArrayList(
                    batch.map { uri ->
                        ContentProviderOperation.newUpdate(uri)
                            .withValue(MediaStore.Images.Media.IS_PENDING, 0)
                            .withExpectedCount(1)
                            .build()
                    },
                )
                try {
                    resolver.applyBatch(MediaStore.AUTHORITY, updates)
                } catch (error: RemoteException) {
                    throw IOException("MediaStore unavailable", error)
                } catch (error: OperationApplicationException) {
                    throw IOException("MediaStore publication failed", error)
                }
            }
        } else {
            for ((photo, file) in legacy) write(photo, file)
        }
    }

    override suspend fun discard() {
        var failure: Exception? = null
        for (uri in created.toList()) {
            try {
                resolver.delete(uri, null, null)
                created.remove(uri)
            } catch (error: Exception) {
                if (failure == null) failure = error else failure.addSuppressed(error)
            }
        }
        failure?.let { throw it }
    }
}
