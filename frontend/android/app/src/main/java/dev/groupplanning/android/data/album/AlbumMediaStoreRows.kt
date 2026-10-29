package dev.groupplanning.android.data.album

import android.content.ContentProviderOperation
import android.content.ContentResolver
import android.content.ContentUris
import android.content.ContentValues
import android.content.OperationApplicationException
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.RemoteException
import android.provider.MediaStore
import java.io.IOException

internal class AlbumMediaStoreRows(
    private val resolver: ContentResolver,
    private val packageName: String,
) {
    fun insert(record: AlbumPendingRecord, photo: AlbumPhoto): Uri {
        val values = ContentValues().apply {
            put(MediaStore.Images.Media.DISPLAY_NAME, record.filePrefix + photo.fileName)
            put(MediaStore.Images.Media.MIME_TYPE, photo.contentType)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                put(MediaStore.Images.Media.RELATIVE_PATH, RELATIVE_PATH)
                put(MediaStore.Images.Media.IS_PENDING, 1)
            }
        }
        return resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values)
            ?: throw IOException("MediaStore insert failed")
    }

    fun recover(record: AlbumPendingRecord) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) throw IOException("Pending unavailable")
        val collection = pendingUri(MediaStore.Images.Media.EXTERNAL_CONTENT_URI)
        val args = pendingArguments(record)
        resolver.query(collection, arrayOf(MediaStore.Images.Media._ID), args, null).use { cursor ->
            if (cursor == null) throw IOException("MediaStore recovery unavailable")
            while (cursor.moveToNext()) {
                val uri = ContentUris.withAppendedId(
                    MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                    cursor.getLong(0),
                )
                delete(record, uri, pendingOnly = true)
            }
        }
        resolver.query(collection, arrayOf(MediaStore.Images.Media._ID), args, null).use {
            if (it == null || it.moveToFirst()) throw IOException("MediaStore recovery incomplete")
        }
    }

    fun publish(record: AlbumPendingRecord, batch: List<Uri>) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) throw IOException("Pending unavailable")
        val updates = ArrayList(
            batch.map { uri ->
                ContentProviderOperation.newUpdate(pendingUri(uri))
                    .withSelection(selection(pendingOnly = true), arguments(record))
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

    fun delete(record: AlbumPendingRecord, uri: Uri, pendingOnly: Boolean) {
        val collection = pendingUri(MediaStore.Images.Media.EXTERNAL_CONTENT_URI)
        val predicate = "${MediaStore.Images.Media._ID} = ? AND ${selection(pendingOnly)}"
        val args = arrayOf(ContentUris.parseId(uri).toString(), *arguments(record))
        // An item URI turns a valid zero-match (e.g. concurrently published) into
        // SecurityException in MediaProvider. A collection delete keeps all guards
        // in the atomic SQL predicate and safely returns zero for that same race.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val query = pendingArguments(record, pendingOnly).apply {
                putString(ContentResolver.QUERY_ARG_SQL_SELECTION, predicate)
                putStringArray(ContentResolver.QUERY_ARG_SQL_SELECTION_ARGS, args)
            }
            resolver.delete(collection, query)
        } else {
            resolver.delete(collection, predicate, args)
        }
    }

    private fun pendingArguments(record: AlbumPendingRecord, pendingOnly: Boolean = true) =
        Bundle().apply {
            putString(ContentResolver.QUERY_ARG_SQL_SELECTION, selection(pendingOnly))
            putStringArray(ContentResolver.QUERY_ARG_SQL_SELECTION_ARGS, arguments(record))
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                putInt(MediaStore.QUERY_ARG_MATCH_PENDING, MediaStore.MATCH_INCLUDE)
            }
        }

    private fun selection(pendingOnly: Boolean): String {
        val clauses = mutableListOf("${MediaStore.Images.Media.DISPLAY_NAME} LIKE ?")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            clauses += "${MediaStore.Images.Media.OWNER_PACKAGE_NAME} = ?"
            clauses += "${MediaStore.Images.Media.RELATIVE_PATH} = ?"
            if (pendingOnly) clauses += "${MediaStore.Images.Media.IS_PENDING} = 1"
        }
        return clauses.joinToString(" AND ")
    }

    private fun arguments(record: AlbumPendingRecord): Array<String> =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            arrayOf(record.filePrefix + "%", packageName, RELATIVE_PATH)
        } else {
            arrayOf(record.filePrefix + "%")
        }

    @Suppress("DEPRECATION") // The pending query flag is the supported API 29 compatibility path.
    private fun pendingUri(uri: Uri): Uri = if (Build.VERSION.SDK_INT == Build.VERSION_CODES.Q) {
        MediaStore.setIncludePending(uri)
    } else {
        uri
    }

    private companion object {
        val RELATIVE_PATH = "${Environment.DIRECTORY_PICTURES}/somewhere/"
    }
}
