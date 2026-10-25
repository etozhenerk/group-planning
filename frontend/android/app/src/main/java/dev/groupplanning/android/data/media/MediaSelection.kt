package dev.groupplanning.android.data.media

import android.content.Context
import android.graphics.Bitmap
import android.net.Uri
import android.provider.OpenableColumns
import java.io.ByteArrayOutputStream
import java.io.IOException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext

internal data class SelectedBytes(val name: String, val type: String, val bytes: ByteArray)

internal class MediaSelection(context: Context) {
    private val resolver = context.applicationContext.contentResolver

    suspend fun describe(uri: Uri): Pair<String, String> = withContext(Dispatchers.IO) {
        if (uri.scheme != "content") throw IOException("Unsupported selection")
        try {
            resolver.takePersistableUriPermission(
                uri,
                android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION,
            )
        } catch (
            _: SecurityException,
        ) { /* Temporary providers remain readable during this session. */ }
        val name = resolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)
            ?.use { cursor -> if (cursor.moveToFirst()) cursor.getString(0) else null } ?: "file"
        name to (resolver.getType(uri) ?: "application/octet-stream")
    }

    suspend fun write(uri: Uri, bytes: ByteArray) = withContext(Dispatchers.IO) {
        if (uri.scheme != "content") throw IOException("Unsupported destination")
        resolver.openOutputStream(uri, "w")?.use { it.write(bytes) }
            ?: throw IOException("Unreadable destination")
    }

    suspend fun read(uri: Uri, maximum: Long, photo: Boolean): SelectedBytes =
        withContext(Dispatchers.IO) {
            if (uri.scheme != "content") throw IOException("Unsupported selection")
            val name = resolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)
                ?.use { cursor -> if (cursor.moveToFirst()) cursor.getString(0) else null }
                ?: "file"
            val type = resolver.getType(uri) ?: "application/octet-stream"
            val output = ByteArrayOutputStream()
            resolver.openInputStream(uri)?.use { input ->
                val buffer = ByteArray(8192)
                while (true) {
                    currentCoroutineContext().ensureActive()
                    val count = input.read(buffer)
                    if (count < 0) break
                    if (output.size() + count > maximum) throw IOException("Selection too large")
                    output.write(buffer, 0, count)
                }
            } ?: throw IOException("Unreadable selection")
            val original = output.toByteArray()
            if (photo && type in listOf("image/heic", "image/heif")) {
                val bitmap = HeicDecoder.decode(original)
                try {
                    val converted = ByteArrayOutputStream()
                    if (!bitmap.compress(Bitmap.CompressFormat.JPEG, 90, converted)) {
                        throw IOException("Photo conversion failed")
                    }
                    val bytes = converted.toByteArray()
                    if (bytes.size > maximum) throw IOException("Selection too large")
                    SelectedBytes(name.substringBeforeLast('.') + ".jpg", "image/jpeg", bytes)
                } finally {
                    bitmap.recycle()
                }
            } else {
                SelectedBytes(name, type, original)
            }
        }
}
