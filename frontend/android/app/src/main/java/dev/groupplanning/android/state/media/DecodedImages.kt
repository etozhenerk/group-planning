package dev.groupplanning.android.state.media

import android.graphics.Bitmap
import android.util.LruCache
import dev.groupplanning.android.data.covers.CoverDecoder
import dev.groupplanning.android.data.covers.CoverIssue
import java.io.IOException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

internal class DecodedImages(maximumBytes: Int = 64 * 1024 * 1024) {
    private val values = object : LruCache<String, Bitmap>(maximumBytes) {
        override fun sizeOf(key: String, value: Bitmap) = value.allocationByteCount
    }

    fun get(key: String): Bitmap? = values.get(key)

    fun put(key: String, bitmap: Bitmap) {
        values.put(key, bitmap)
    }

    fun clear() {
        values.evictAll()
    }
}

internal suspend fun decodeImage(bytes: ByteArray): Bitmap = withContext(Dispatchers.IO) {
    try {
        // Reuse the bounded, EXIF-aware image decoder used for uploaded covers.
        CoverDecoder.bytes(bytes, 2048)
    } catch (invalid: CoverIssue) {
        throw IOException("Invalid image", invalid)
    }
}
