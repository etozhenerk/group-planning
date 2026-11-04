package dev.groupplanning.android

import android.graphics.Bitmap
import android.graphics.Color
import android.os.SystemClock
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.captureToImage
import androidx.test.platform.app.InstrumentationRegistry
import java.io.File
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue

internal class AvatarFrameCapture {
    private val directory = File(
        checkNotNull(InstrumentationRegistry.getArguments().getString("additionalTestOutputDir")),
        "avatar-ack",
    ).apply { check(mkdirs() || isDirectory) }
    private val samples = JSONArray()
    private var baseline: androidx.compose.ui.geometry.Rect? = null
    private var baselinePixels: IntArray? = null

    fun capture(
        name: String,
        avatar: SemanticsNodeInteraction,
        photo: Boolean,
        fixed: Boolean = true,
    ): Boolean {
        val bounds = avatar.fetchSemanticsNode().boundsInWindow
        val bitmap = avatar.captureToImage().asAndroidBitmap()
        val pixels = IntArray(bitmap.width * bitmap.height)
        bitmap.getPixels(pixels, 0, bitmap.width, 0, 0, bitmap.width, bitmap.height)
        val white = pixels.count {
            Color.red(it) > 240 &&
                Color.green(it) > 240 &&
                Color.blue(it) > 240
        }
        val sand = pixels.count {
            Color.red(it) > 140 &&
                Color.red(it) > Color.green(it) + 5 &&
                Color.green(it) > Color.blue(it) + 5
        }
        val whiteRatio = white.toDouble() / pixels.size
        val sandRatio = sand.toDouble() / pixels.size
        val matches = if (photo) whiteRatio > 0.1 else whiteRatio < 0.01 && sandRatio > 0.5
        if (matches && baseline == null) {
            baseline = bounds
            baselinePixels = pixels
        }
        if (matches && fixed) {
            assertEquals(checkNotNull(baseline).left, bounds.left, 1f)
            assertEquals(checkNotNull(baseline).top, bounds.top, 1f)
            baselinePixels?.takeIf { it.size == pixels.size }?.let { original ->
                val difference = pixels.indices.sumOf { index ->
                    kotlin.math.abs(Color.red(original[index]) - Color.red(pixels[index])) +
                        kotlin.math.abs(Color.green(original[index]) - Color.green(pixels[index])) +
                        kotlin.math.abs(Color.blue(original[index]) - Color.blue(pixels[index]))
                }.toDouble() / (pixels.size * 3 * 255)
                assertTrue("The displayed avatar changed", difference < 0.03)
            }
        }
        File(directory, "$name.png").outputStream().use {
            check(bitmap.compress(Bitmap.CompressFormat.PNG, 100, it))
        }
        samples.put(
            JSONObject().put("name", name).put("elapsedNanos", SystemClock.elapsedRealtimeNanos())
                .put("whiteRatio", whiteRatio).put("sandRatio", sandRatio).put("matches", matches)
                .put(
                    "avatar",
                    JSONArray(listOf(bounds.left, bounds.top, bounds.width, bounds.height)),
                ),
        )
        return matches
    }

    fun finish(name: String) {
        File(directory, "$name.json").writeText(samples.toString(2))
    }
}
