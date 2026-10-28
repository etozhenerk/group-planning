package dev.groupplanning.android

import android.content.ContentResolver
import android.content.ContentUris
import android.database.Cursor
import android.graphics.Bitmap
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import androidx.exifinterface.media.ExifInterface
import androidx.test.filters.SdkSuppress
import androidx.test.platform.app.InstrumentationRegistry
import dev.groupplanning.android.data.album.AlbumPhoto
import dev.groupplanning.android.data.album.MediaStoreAlbumGallery
import java.io.File
import java.util.UUID
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

@SdkSuppress(minSdkVersion = 29)
class AlbumGalleryDeviceTests {
    private val context = InstrumentationRegistry.getInstrumentation().targetContext
    private val resolver = context.contentResolver

    @Test fun pendingOriginalsPublishWithExifAndRollbackOnlyTouchesOwnedUris() =
        runBlocking(Dispatchers.IO) {
            check(context.packageName == "dev.groupplanning.android.uitesthost")
            val file = orientedPhoto()
            val gallery = MediaStoreAlbumGallery(context)
            val previous = gallery.begin()
            val operation = gallery.begin()
            val retained = AlbumPhoto(UUID.randomUUID(), "image/jpeg", file.length())
            val photos = List(2) { retained.copy(id = UUID.randomUUID()) }
            try {
                gallery.requirePermission()
                previous.stage(retained, file)
                previous.publish()
                val old = find(retained)
                assertEquals(0, pending(old))
                for (photo in photos) operation.stage(photo, file)
                photos.forEach { assertEquals(0, count(it, includePending = false)) }
                val created = photos.map(::find)
                for (uri in created) {
                    assertEquals(1, pending(uri))
                    assertOriginal(file, uri)
                }
                operation.publish()
                for (uri in created) {
                    assertEquals(0, pending(uri))
                    assertOriginal(file, uri)
                }
                operation.discard()
                assertEquals(0, count(photos.first()))
                assertEquals(0, count(photos.last()))
                assertEquals(1, count(retained))
                assertOriginal(file, old)
            } finally {
                operation.discard()
                previous.discard()
                file.delete()
            }
        }

    @Test fun failedStageCanRemoveItsPendingEntryWithoutPublishing() = runBlocking(Dispatchers.IO) {
        check(context.packageName == "dev.groupplanning.android.uitesthost")
        val missing = File(context.cacheDir, "missing-${UUID.randomUUID()}.jpg")
        val photo = AlbumPhoto(UUID.randomUUID(), "image/jpeg", 1)
        val operation = MediaStoreAlbumGallery(context).begin()
        try {
            assertTrue(runCatching { operation.stage(photo, missing) }.isFailure)
            assertEquals(1, pending(find(photo)))
            operation.discard()
            assertEquals(0, count(photo))
        } finally {
            operation.discard()
        }
    }

    private fun orientedPhoto(): File {
        val file = File.createTempFile("album-gallery-", ".jpg", context.cacheDir)
        val bitmap = Bitmap.createBitmap(48, 24, Bitmap.Config.ARGB_8888)
        try {
            bitmap.eraseColor(Color.MAGENTA)
            file.outputStream().use { check(bitmap.compress(Bitmap.CompressFormat.JPEG, 95, it)) }
            ExifInterface(file).apply {
                setAttribute(ExifInterface.TAG_ORIENTATION, "6")
                saveAttributes()
            }
            return file
        } finally {
            bitmap.recycle()
        }
    }

    private fun find(photo: AlbumPhoto): Uri = query(photo).use { cursor ->
        checkNotNull(cursor)
        assertEquals(1, cursor.count)
        check(cursor.moveToFirst())
        ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, cursor.getLong(0))
    }

    private fun count(photo: AlbumPhoto, includePending: Boolean = true): Int =
        query(photo, includePending).use { checkNotNull(it).count }

    @Suppress("DEPRECATION") // API 29 exposes pending rows through this URI flag.
    private fun query(photo: AlbumPhoto, includePending: Boolean = true): Cursor? {
        val collection = MediaStore.Images.Media.EXTERNAL_CONTENT_URI
        val uri = if (Build.VERSION.SDK_INT == Build.VERSION_CODES.Q && includePending) {
            MediaStore.setIncludePending(collection)
        } else {
            collection
        }
        val args = Bundle().apply {
            putString(
                ContentResolver.QUERY_ARG_SQL_SELECTION,
                "${MediaStore.Images.Media.DISPLAY_NAME} LIKE ?",
            )
            putStringArray(
                ContentResolver.QUERY_ARG_SQL_SELECTION_ARGS,
                arrayOf("somewhere-%-${photo.fileName}"),
            )
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && includePending) {
                putInt(MediaStore.QUERY_ARG_MATCH_PENDING, MediaStore.MATCH_INCLUDE)
            }
        }
        return resolver.query(uri, arrayOf(MediaStore.Images.Media._ID), args, null)
    }

    private fun pending(uri: Uri): Int = resolver.query(
        uri,
        arrayOf(MediaStore.Images.Media.IS_PENDING),
        null,
        null,
        null,
    ).use {
        checkNotNull(it)
        check(it.moveToFirst())
        it.getInt(0)
    }

    private fun assertOriginal(file: File, uri: Uri) {
        val bytes = resolver.openInputStream(uri).use { checkNotNull(it).readBytes() }
        assertArrayEquals(file.readBytes(), bytes)
        assertEquals(
            6,
            ExifInterface(bytes.inputStream()).getAttributeInt(
                ExifInterface.TAG_ORIENTATION,
                0,
            ),
        )
    }
}
