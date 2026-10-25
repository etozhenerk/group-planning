package dev.groupplanning.android.data.covers

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import androidx.core.graphics.scale
import androidx.exifinterface.media.ExifInterface
import java.io.File
import java.io.InputStream
import kotlin.math.max
import kotlin.math.roundToInt

/** Android 8 uses bounded JPEG/PNG decoding; later versions use ImageDecoder. */
internal object LegacyCoverDecoder {
    fun file(file: File): Bitmap = decode({ file.inputStream() }, 64_000_000, 32768, 1600)
    fun bytes(bytes: ByteArray, maximum: Int): Bitmap =
        decode({ bytes.inputStream() }, 16_000_000, 8192, maximum)

    private fun decode(input: () -> InputStream, pixels: Long, side: Int, maximum: Int): Bitmap {
        val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        input().use { BitmapFactory.decodeStream(it, null, options) }
        CoverDecoder.bounds(options.outWidth, options.outHeight, pixels, side)
        if (options.outMimeType !in setOf("image/jpeg", "image/png")) throw CoverIssue()
        options.inJustDecodeBounds = false
        var sample = 1
        while (max(options.outWidth, options.outHeight) / sample > maximum * 2) sample *= 2
        options.inSampleSize = sample
        var bitmap =
            input().use { BitmapFactory.decodeStream(it, null, options) } ?: throw CoverIssue()
        try {
            val orientation = if (options.outMimeType ==
                "image/jpeg"
            ) {
                input().use {
                    ExifInterface(it).getAttributeInt(ExifInterface.TAG_ORIENTATION, 1)
                }
            } else {
                1
            }
            val matrix = Matrix().apply {
                when (orientation) {
                    2 -> setScale(-1f, 1f)
                    3 -> setRotate(180f)
                    4 -> {
                        setRotate(180f)
                        postScale(-1f, 1f)
                    }
                    5 -> {
                        setRotate(90f)
                        postScale(-1f, 1f)
                    }
                    6 -> setRotate(90f)
                    7 -> {
                        setRotate(-90f)
                        postScale(-1f, 1f)
                    }
                    8 -> setRotate(-90f)
                }
            }
            val oriented = Bitmap.createBitmap(
                bitmap,
                0,
                0,
                bitmap.width,
                bitmap.height,
                matrix,
                true,
            )
            if (oriented !== bitmap) {
                bitmap.recycle()
                bitmap = oriented
            }
            val scale = minOf(1.0, maximum.toDouble() / max(bitmap.width, bitmap.height))
            val resized = bitmap.scale(
                max(1, (bitmap.width * scale).roundToInt()),
                max(
                    1,
                    (
                        bitmap.height *
                            scale
                        ).roundToInt(),
                ),
                true,
            )
            if (resized !== bitmap) bitmap.recycle()
            return resized
        } catch (error: Exception) {
            bitmap.recycle()
            throw error
        }
    }
}
