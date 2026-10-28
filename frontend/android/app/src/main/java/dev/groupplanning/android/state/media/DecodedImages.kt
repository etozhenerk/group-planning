package dev.groupplanning.android.state.media

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.LruCache
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
    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeByteArray(bytes, 0, bytes.size, bounds)
    val options = BitmapFactory.Options().apply {
        inSampleSize = generateSequence(1) { it * 2 }.first { sample ->
            bounds.outWidth / sample <= 2048 && bounds.outHeight / sample <= 2048
        }
    }
    BitmapFactory.decodeByteArray(bytes, 0, bytes.size, options)
        ?: throw IOException("Invalid image")
}
