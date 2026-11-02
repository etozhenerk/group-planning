package dev.groupplanning.android

import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.click
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.swipeLeft
import androidx.compose.ui.test.swipeRight
import androidx.test.platform.app.InstrumentationRegistry
import java.io.File
import kotlin.math.abs
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class VibeStabilityUiTests {
    @get:Rule(order = 0)
    val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule(order = 1)
    val compose = qaCreateEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)
    private val samples = JSONArray()

    @Before fun configure() = fixture.configure()

    @Test fun delayedPromotionAndBothSwipeDirectionsKeepSettledPhotoSize() {
        val arguments = InstrumentationRegistry.getArguments()
        check(arguments.getString("allowSystemSettings") == "true")
        val original = fixture.shell("settings get global animator_duration_scale").trim()
        val meeting = "dab00000-0000-4000-8000-000000000001"
        val photos = ChatReadLiveApi(fixture.context)
            .request("memories", "meetings/$meeting/memories").getJSONArray("photos")
        val target = photos.getJSONObject(1).getString("id")
        try {
            for (reduced in listOf(false, true)) {
                fixture.shell(
                    "settings put global animator_duration_scale ${if (reduced) 0 else 1}",
                )
                QaResponseGate.holdMedia("/api/v1/meetings/$meeting/media/$target/content")
                fixture.launch("memories").use {
                    fixture.waitTag("meetings-list")
                    compose.onNodeWithText("Прошедшие").performClick()
                    fixture.waitText("Суббота у озера")
                    compose.onNodeWithText("Суббота у озера").performScrollTo().performClick()
                    fixture.waitText("Открыть вайб")
                    compose.onNodeWithText("Открыть вайб").performClick()
                    fixture.waitText("1 / 3")
                    compose.waitUntil(15_000) { QaResponseGate.mediaEntered }
                    compose.onNodeWithTag("memory-fullscreen").assertDoesNotExist()
                    fixture.screenshot("vibe-delayed-${if (reduced) "reduced" else "normal"}")
                    QaResponseGate.releaseMedia()
                    compose.waitUntil(15_000) { photoExists(1) }
                    sampleSettled(1, reduced)
                    compose.onNodeWithTag("photo-stack").performTouchInput { swipeLeft() }
                    fixture.waitText("2 / 3")
                    sampleSettled(2, reduced)
                    compose.onNodeWithTag("photo-stack").performTouchInput { swipeRight() }
                    fixture.waitText("3 / 3")
                    sampleSettled(3, reduced)
                    compose.onNodeWithTag("photo-stack").performTouchInput { swipeRight() }
                    fixture.waitText("1 / 3")
                    sampleSettled(1, reduced)
                    compose.onNodeWithTag("photo-stack").performTouchInput { click() }
                    fixture.waitTag("memory-fullscreen")
                    fixture.device.pressBack()
                    fixture.waitAbsent("memory-fullscreen")
                    fixture.waitText("1 / 3")
                    compose.onNodeWithText("Назад").performClick()
                    fixture.waitTag("message-composer")
                }
            }
        } finally {
            QaResponseGate.releaseMedia()
            if (original == "null") {
                fixture.shell("settings delete global animator_duration_scale")
            } else {
                require(original.toFloatOrNull() != null)
                fixture.shell("settings put global animator_duration_scale $original")
            }
            val output = File(checkNotNull(arguments.getString("additionalTestOutputDir")))
            output.mkdirs()
            File(output, "vibe-settled-samples.json").writeText(samples.toString(2))
        }
    }

    private fun photoExists(index: Int) = compose.onAllNodes(
        hasContentDescription(fixture.context.getString(R.string.memories_count, index, 3)) and
            hasTestTagPrefix(),
        useUnmergedTree = true,
    ).fetchSemanticsNodes().size == 1

    private fun hasTestTagPrefix() = androidx.compose.ui.test.SemanticsMatcher("Media image") {
        it.config.getOrNull(androidx.compose.ui.semantics.SemanticsProperties.TestTag)
            ?.startsWith("media-image-") == true
    }

    private fun sampleSettled(index: Int, reduced: Boolean) {
        compose.waitForIdle()
        val image = compose.onAllNodes(
            hasContentDescription(fixture.context.getString(R.string.memories_count, index, 3)) and
                hasTestTagPrefix(),
            useUnmergedTree = true,
        )[0]
        val initial = image.fetchSemanticsNode().boundsInRoot
        var elapsed = 0L
        for (pause in listOf(0L, 500L, 500L, 1000L)) {
            if (pause > 0) Thread.sleep(pause)
            elapsed += pause
            val current = image.fetchSemanticsNode().boundsInRoot
            val tolerance = 2 * compose.density.density
            assertTrue("Photo drifts at ${elapsed}ms", sameRect(initial, current, tolerance))
            samples.put(
                JSONObject().put("index", index).put("reduced", reduced).put("elapsedMs", elapsed)
                    .put("left", current.left).put("top", current.top)
                    .put("width", current.width).put("height", current.height),
            )
        }
        fixture.screenshot("vibe-settled-$index-${if (reduced) "reduced" else "normal"}")
    }

    private fun sameRect(a: Rect, b: Rect, tolerance: Float) = abs(a.left - b.left) <= tolerance &&
        abs(a.top - b.top) <= tolerance &&
        abs(a.width - b.width) <= tolerance &&
        abs(a.height - b.height) <= tolerance
}
