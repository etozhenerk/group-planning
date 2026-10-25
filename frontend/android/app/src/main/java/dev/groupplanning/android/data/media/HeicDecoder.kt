package dev.groupplanning.android.data.media

import android.graphics.Bitmap
import android.graphics.ImageDecoder
import android.os.Build
import java.io.IOException
import java.nio.ByteBuffer
import kotlin.math.max
import kotlin.math.roundToInt

internal object HeicDecoder {
    fun decode(bytes: ByteArray): Bitmap {
        if (Build.VERSION.SDK_INT < 28) throw IOException("HEIC decoding is unavailable")
        return ImageDecoder.decodeBitmap(ImageDecoder.createSource(ByteBuffer.wrap(bytes))) {
                decoder,
                info,
                _,
            ->
            val width = info.size.width
            val height = info.size.height
            if (width !in 1..32768 ||
                height !in 1..32768 ||
                width.toLong() * height > 96_000_000 ||
                info.isAnimated
            ) {
                throw IOException("Unsupported photo dimensions")
            }
            val scale = minOf(1.0, 4096.0 / max(width, height))
            decoder.setTargetSize(
                max(1, (width * scale).roundToInt()),
                max(1, (height * scale).roundToInt()),
            )
            decoder.allocator = ImageDecoder.ALLOCATOR_SOFTWARE
            decoder.setOnPartialImageListener { false }
        }
    }
}
