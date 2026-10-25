package dev.groupplanning.android.data.covers

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import androidx.core.graphics.createBitmap
import dev.groupplanning.android.data.api.models.PreparedCover
import java.io.ByteArrayOutputStream
import java.io.File
import java.util.Base64
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.ensureActive

internal class CoverProcessor {
    suspend fun prepare(file: File): PreparedCover {
        if (file.length() > 50 * 1024 * 1024) throw CoverIssue(tooLarge = true)
        val bitmap = CoverDecoder.file(file)
        try {
            currentCoroutineContext().ensureActive()
            val opaque = createBitmap(bitmap.width, bitmap.height, Bitmap.Config.ARGB_8888)
            try {
                val canvas = Canvas(opaque)
                canvas.drawColor(Color.WHITE)
                canvas.drawBitmap(bitmap, 0f, 0f, null)
                val output = ByteArrayOutputStream()
                if (!opaque.compress(Bitmap.CompressFormat.JPEG, 85, output)) throw CoverIssue()
                if (output.size() > 2 * 1024 * 1024) throw CoverIssue(tooLarge = true)
                currentCoroutineContext().ensureActive()
                return PreparedCover(
                    "image/jpeg",
                    Base64.getEncoder().encodeToString(output.toByteArray()),
                )
            } finally {
                opaque.recycle()
            }
        } finally {
            bitmap.recycle()
        }
    }

    suspend fun preview(bytes: ByteArray, maximum: Int = 1600): Bitmap {
        if (bytes.size > 5 * 1024 * 1024) throw CoverIssue(tooLarge = true)
        currentCoroutineContext().ensureActive()
        val bitmap = CoverDecoder.bytes(bytes, maximum)
        try {
            currentCoroutineContext().ensureActive()
        } catch (
            error: Exception,
        ) {
            bitmap.recycle()
            throw error
        }
        return bitmap
    }
}
