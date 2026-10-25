package dev.groupplanning.android.data.covers

import android.graphics.Bitmap
import android.graphics.ImageDecoder
import android.os.Build
import androidx.annotation.RequiresApi
import java.io.DataInputStream
import java.io.File
import java.io.InputStream
import java.nio.ByteBuffer
import kotlin.math.max
import kotlin.math.roundToInt

internal object CoverDecoder {
    fun file(file: File): Bitmap {
        file.inputStream().use(::rejectAnimatedPng)
        return if (Build.VERSION.SDK_INT >=
            28
        ) {
            modern(ImageDecoder.createSource(file), 64_000_000, 32768, 1600)
        } else {
            LegacyCoverDecoder.file(file)
        }
    }

    fun bytes(bytes: ByteArray, maximum: Int): Bitmap = if (Build.VERSION.SDK_INT >= 28) {
        modern(ImageDecoder.createSource(ByteBuffer.wrap(bytes)), 16_000_000, 8192, maximum)
    } else {
        LegacyCoverDecoder.bytes(bytes, maximum)
    }

    @RequiresApi(28)
    private fun modern(source: ImageDecoder.Source, pixels: Long, side: Int, maximum: Int): Bitmap =
        ImageDecoder.decodeBitmap(source) { decoder, info, _ ->
            bounds(info.size.width, info.size.height, pixels, side)
            if (info.mimeType !in
                setOf("image/jpeg", "image/png", "image/heic", "image/heif", "image/webp") ||
                info.isAnimated
            ) {
                throw CoverIssue()
            }
            val scale = minOf(1.0, maximum.toDouble() / max(info.size.width, info.size.height))
            decoder.setTargetSize(
                max(1, (info.size.width * scale).roundToInt()),
                max(
                    1,
                    (
                        info.size.height *
                            scale
                        ).roundToInt(),
                ),
            )
            decoder.allocator = ImageDecoder.ALLOCATOR_SOFTWARE
            decoder.setOnPartialImageListener { false }
        }

    fun bounds(width: Int, height: Int, pixels: Long, side: Int) {
        if (width !in 1..side ||
            height !in 1..side ||
            width.toLong() * height > pixels
        ) {
            throw CoverIssue(tooLarge = true)
        }
    }

    private fun rejectAnimatedPng(input: InputStream) {
        val stream = DataInputStream(input)
        val signature = ByteArray(8)
        if (stream.read(signature) != 8 ||
            !signature.contentEquals(byteArrayOf(-119, 80, 78, 71, 13, 10, 26, 10))
        ) {
            return
        }
        while (true) {
            val size = stream.readInt().toLong() and 0xffffffffL
            val kind = ByteArray(4).also(stream::readFully).decodeToString()
            if (kind == "acTL") throw CoverIssue()
            if (kind == "IDAT" || kind == "IEND") return
            var remaining = size + 4
            while (remaining > 0) {
                val skipped = stream.skip(remaining)
                if (skipped <= 0) throw CoverIssue()
                remaining -= skipped
            }
        }
    }
}
