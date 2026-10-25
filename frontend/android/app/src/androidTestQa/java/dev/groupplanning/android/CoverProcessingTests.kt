package dev.groupplanning.android

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import androidx.exifinterface.media.ExifInterface
import androidx.test.platform.app.InstrumentationRegistry
import dev.groupplanning.android.data.covers.CoverProcessor
import dev.groupplanning.android.data.covers.LegacyCoverDecoder
import java.io.File
import java.io.RandomAccessFile
import java.util.Base64
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class CoverProcessingTests {
    private val directory = InstrumentationRegistry.getInstrumentation().targetContext.cacheDir

    @Test fun nativeAndLegacyDecodeNormalizeRotationBeforeBoundedJpegEncoding() = runBlocking {
        val file = File.createTempFile("orientation-", ".jpg", directory)
        val source = Bitmap.createBitmap(3200, 1800, Bitmap.Config.ARGB_8888)
        try {
            source.eraseColor(Color.GREEN)
            file.outputStream().use { check(source.compress(Bitmap.CompressFormat.JPEG, 90, it)) }
            ExifInterface(file).apply {
                setAttribute(ExifInterface.TAG_ORIENTATION, "6")
                saveAttributes()
            }
            val prepared = CoverProcessor().prepare(file)
            val bytes = Base64.getDecoder().decode(prepared.data)
            val decoded = checkNotNull(BitmapFactory.decodeByteArray(bytes, 0, bytes.size))
            try {
                assertEquals(900, decoded.width)
                assertEquals(1600, decoded.height)
            } finally {
                decoded.recycle()
            }
            assertTrue(bytes.size <= 2 * 1024 * 1024)
            assertEquals(
                0,
                ExifInterface(
                    bytes.inputStream(),
                ).getAttributeInt(ExifInterface.TAG_ORIENTATION, 0),
            )
            val legacy = LegacyCoverDecoder.file(file)
            try {
                assertEquals(900, legacy.width)
                assertEquals(1600, legacy.height)
            } finally {
                legacy.recycle()
            }
        } finally {
            source.recycle()
            file.delete()
        }
    }

    @Test fun oversizedAndUnreadableFilesAreRejected() = runBlocking {
        val file = File.createTempFile("invalid-", ".jpg", directory)
        try {
            file.writeText("not a photo")
            assertTrue(runCatching { CoverProcessor().prepare(file) }.isFailure)
            RandomAccessFile(file, "rw").use { it.setLength(50L * 1024 * 1024 + 1) }
            assertTrue(runCatching { CoverProcessor().prepare(file) }.isFailure)
        } finally {
            file.delete()
        }
    }
}
