package dev.groupplanning.android

import android.net.Uri
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.test.assertContentDescriptionEquals
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.swipe
import androidx.compose.ui.test.swipeLeft
import androidx.compose.ui.test.swipeRight
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import androidx.test.uiautomator.Until
import java.io.File
import java.util.regex.Pattern
import org.json.JSONArray
import org.json.JSONObject
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

/** QA-only draft. Compile/run only after immutable candidate handoff and source binding. */
class VibeCheckpointSmoke {
    @get:Rule(order = 0)
    val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule(order = 1)
    val compose = qaCreateEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)
    private val records = JSONArray()
    private val ownPhotos = mutableListOf<Uri>()
    private val meeting = "dab00000-0000-4000-8000-000000000001"

    @Before fun configure() {
        check(InstrumentationRegistry.getArguments().getString("frozenVibeCheckpoint") == "true")
        fixture.configure()
    }

    @After fun cleanup() {
        QaPhotoBatchProbe.reset()
        QaResponseGate.releaseMedia()
        ownPhotos.forEach { fixture.context.contentResolver.delete(it, null, null) }
        val path = checkNotNull(
            InstrumentationRegistry.getArguments().getString("additionalTestOutputDir"),
        )
        val output = File(path).apply { mkdirs() }
        File(output, "checkpoint-actions.json").writeText(records.toString(2))
    }

    @Test fun deckBothDirectionsCycleRollbackFlickAndViewerTracking() {
        withAlbum {
            fixture.screenshot("ready")
            compose.onNodeWithTag("photo-stack").performTouchInput { swipeLeft() }
            waitCounter(2)
            compose.onNodeWithTag("memory-fullscreen").assertDoesNotExist()
            note("left swipe ->2, no accidental viewer")
            compose.onNodeWithTag("photo-stack").performTouchInput { swipeRight() }
            waitCounter(3)
            note("right swipe ->3, both directions advance")
            compose.onNodeWithTag("photo-stack").performTouchInput { swipeRight() }
            waitCounter(1)
            fixture.screenshot("cycle")
            note("last -> first cycle; visual motion requires accompanying agent video")
            compose.onNodeWithTag("photo-stack").performTouchInput {
                swipe(center, center + Offset(width * .06f, 0f), durationMillis = 700)
            }
            waitCounter(1)
            compose.onNodeWithTag("memory-fullscreen").assertDoesNotExist()
            fixture.screenshot("rollback")
            note("short slow drag -> rollback, counter unchanged")
            compose.onNodeWithTag("photo-stack").performTouchInput {
                swipe(center, center + Offset(-width * .20f, 0f), durationMillis = 80)
            }
            waitCounter(2)
            note("short high-velocity flick ->2")
            compose.onNodeWithContentDescription("Все фото").performClick()
            fixture.screenshot("grid")
            compose.onNodeWithContentDescription(
                fixture.context.getString(R.string.memories_count, 3, 3),
            ).performClick()
            fixture.waitTag("memory-fullscreen")
            waitCounter(3)
            fixture.screenshot("viewer")
            fixture.device.pressBack()
            fixture.waitAbsent("memory-fullscreen")
            fixture.device.pressBack()
            fixture.waitTag("photo-stack")
            waitCounter(3)
            note("grid tile3 -> viewer3 -> grid -> deck3; selected photo tracked")
        }
    }

    @Test fun ownUploadFormPickerCancelAndPartialRetry() {
        repeat(2) { ownPhotos += createQaTestPhoto(fixture.context, it) }
        val api = ChatReadLiveApi(fixture.context)
        val before = photoIds(api)
        assertEquals(3, before.size)
        withAlbum {
            compose.onNodeWithTag("album-add").performClick()
            fixture.waitTag("upload-sheet")
            fixture.screenshot("upload-own-empty")
            val pickerPackage = Pattern.compile(".*(?:photopicker|providers\\.media).*")
            assertTrue(!fixture.device.hasObject(By.pkg(pickerPackage)))
            note("add opens own short form before external picker")
            compose.onNodeWithText("Выбрать фото", substring = false).performClick()
            assertTrue(fixture.device.wait(Until.hasObject(By.pkg(pickerPackage)), 10_000))
            fixture.device.pressBack()
            fixture.waitTag("upload-sheet")
            fixture.screenshot("upload-picker-cancel")
            note("external picker cancel keeps own form")
            compose.onNodeWithText("Выбрать фото", substring = false).performClick()
            assertTrue(fixture.device.wait(Until.hasObject(By.pkg(pickerPackage)), 10_000))
            fixture.screenshot("picker-own-two-latest-review-before-selection")
            val thumbnails = checkNotNull(
                fixture.device.wait(
                    Until.findObjects(
                        By.pkg(pickerPackage).desc(Pattern.compile("(?i).*(Photo|Фото|Фотография).*")),
                    ),
                    10_000,
                ),
            )
            assertTrue("Review the two newly seeded solid-color QA photos", thumbnails.size >= 2)
            thumbnails.take(2).forEach { it.click() }
            checkNotNull(
                fixture.device.wait(
                    Until.findObject(By.pkg(pickerPackage).text(Pattern.compile("(Add|Добавить|Done|Готово).*"))),
                    5_000,
                ),
            ).click()
            fixture.waitTag("upload-sheet")
            compose.waitUntil(15_000) {
                runCatching { compose.onNodeWithTag("media-batch-send").assertIsEnabled() }.isSuccess
            }
            fixture.screenshot("upload-selected")
            QaPhotoBatchProbe.arm()
            compose.onNodeWithTag("media-batch-send").performScrollTo().performClick()
            compose.waitUntil(15_000) { QaPhotoBatchProbe.failureEntered }
            fixture.screenshot("upload-common-busy")
            QaPhotoBatchProbe.releaseFailure()
            fixture.waitTag("media-upload-error")
            compose.waitUntil(10_000) {
                compose.onAllNodes(
                    hasContentDescription(fixture.context.getString(R.string.photo_preview)),
                    useUnmergedTree = true,
                ).fetchSemanticsNodes().size == 1
            }
            fixture.screenshot("upload-partial")
            note("first success + second committed reply lost -> one retained failed item")
            QaPhotoBatchProbe.allowRetry()
            compose.onNodeWithTag("media-batch-send").performScrollTo().performClick()
            fixture.waitAbsent("upload-sheet")
            assertEquals(listOf(1, 2), QaPhotoBatchProbe.publishCounts.values.sorted())
            val after = photoIds(api)
            assertEquals(5, after.size)
            assertTrue(after.containsAll(before))
            assertEquals(2, (after - before).size)
            note("retry only retained item, original publish1 not repeated, exactly2 new photo IDs")
            fixture.screenshot("upload-confirmed-once")
        }
    }

    private fun waitCounter(index: Int) {
        compose.waitUntil(15_000) {
            runCatching {
                compose.onNodeWithTag("photo-stack").assertContentDescriptionEquals(
                    fixture.context.getString(R.string.memories_count, index, 3),
                )
            }.isSuccess
        }
    }

    private fun withAlbum(block: () -> Unit) {
        fixture.launch("memories").use {
            try {
                fixture.waitTag("meetings-list")
                compose.onNodeWithText("Прошедшие").performClick()
                fixture.waitText("Суббота у озера")
                compose.onNodeWithText("Суббота у озера").performScrollTo().performClick()
                fixture.waitText("Открыть вайб")
                compose.onNodeWithText("Открыть вайб").performClick()
                waitCounter(1)
                block()
            } catch (failure: Throwable) {
                runCatching { fixture.screenshot("live-failure") }
                throw failure
            }
        }
    }

    private fun photoIds(api: ChatReadLiveApi): Set<String> {
        val photos = api.request("memories", "meetings/$meeting/memories").getJSONArray("photos")
        val ids = (0 until photos.length()).map { photos.getJSONObject(it).getString("id") }
        assertEquals(ids.size, ids.toSet().size)
        return ids.toSet()
    }

    private fun note(action: String) {
        records.put(JSONObject().put("action", action).put("atEpochMs", System.currentTimeMillis()))
    }
}
