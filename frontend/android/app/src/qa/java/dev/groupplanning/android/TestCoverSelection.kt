package dev.groupplanning.android

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import dev.groupplanning.android.data.api.models.PreparedCover
import dev.groupplanning.android.data.covers.CoverIssue
import dev.groupplanning.android.data.covers.CoverProcessor
import dev.groupplanning.android.data.covers.CoverSelectionSource
import java.io.File
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext

internal class TestCoverSelection(context: Context) : CoverSelectionSource {
    private val directory = context.cacheDir
    private var selections = 0
    override suspend fun select(): PreparedCover? = withContext(Dispatchers.IO) {
        selections++
        delay(250)
        if (selections == 2) throw CoverIssue()
        if (selections == 3) return@withContext null
        val file = File.createTempFile("cover-test-", ".jpg", directory)
        val bitmap = Bitmap.createBitmap(1800, 1200, Bitmap.Config.ARGB_8888)
        try {
            val canvas = Canvas(bitmap)
            canvas.drawColor(Color.rgb(30, 166, 140))
            canvas.drawRect(0f, 0f, 600f, 1200f, Paint().apply { color = Color.rgb(180, 64, 102) })
            file.outputStream().use { check(bitmap.compress(Bitmap.CompressFormat.JPEG, 95, it)) }
            CoverProcessor().prepare(file)
        } finally {
            bitmap.recycle()
            file.delete()
        }
    }
}
