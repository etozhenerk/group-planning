package dev.groupplanning.android

import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.test.uiautomator.By
import androidx.test.uiautomator.Until
import dev.groupplanning.android.qaCreateEmptyComposeRule as createEmptyComposeRule
import java.util.regex.Pattern
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class NativeVibeUploadUiTests {
    @get:Rule(order = 0)
    val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule(order = 1)
    val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Before fun configure() = fixture.configure()

    @After fun releaseGate() = QaResponseGate.releaseMedia()

    @Test fun confirmedVibePhotoClosesPreviewAndAppearsOnce() {
        verifyUpload(delayed = false)
    }

    @Test fun delayedConfirmationKeepsVibePreviewUntilReleased() {
        verifyUpload(delayed = true)
    }

    private fun verifyUpload(delayed: Boolean) {
        val id = "deb00000-0000-4000-8000-000000000004"
        val api = ChatReadLiveApi(fixture.context)
        val before = photoIds(api, id)
        assertEquals(3, before.size)
        val photo = createQaTestPhoto(fixture.context, 0)
        if (delayed) QaResponseGate.holdPublication("/api/v1/meetings/$id/media/")
        try {
            fixture.launch("design").use {
                fixture.waitTag("meetings-list")
                compose.onNodeWithText("Прошедшие").performClick()
                fixture.waitText("Суббота без спешки")
                compose.onNodeWithText("Суббота без спешки").performScrollTo().performClick()
                fixture.waitText("Открыть вайб")
                compose.onNodeWithText("Открыть вайб").performClick()
                fixture.waitGalleryCounter(1, 3)
                compose.onNodeWithTag("album-add").performClick()
                fixture.waitTag("upload-sheet")
                compose.onNodeWithText("Выбрать фото", substring = false).performClick()
                val picker = Pattern.compile(".*(?:photopicker|providers\\.media).*")
                assertTrue(fixture.device.wait(Until.hasObject(By.pkg(picker)), 10_000))
                val thumbnails = checkNotNull(
                    fixture.device.wait(
                        Until.findObjects(
                            By.pkg(picker).desc(Pattern.compile("(?i).*(Photo|Фото|Фотография).*")),
                        ),
                        10_000,
                    ),
                )
                assertTrue(thumbnails.isNotEmpty())
                thumbnails.first().click()
                checkNotNull(
                    fixture.device.wait(
                        Until.findObject(By.text(Pattern.compile("(Add|Добавить|Done|Готово).*"))),
                        5_000,
                    ),
                ).click()
                fixture.waitTag("upload-sheet")
                fixture.screenshot("native-vibe-photo-preview")
                compose.onNodeWithTag("media-batch-send").performScrollTo().performClick()
                if (delayed) {
                    compose.waitUntil(15_000) { QaResponseGate.mediaEntered }
                    fixture.waitTag("upload-sheet")
                    compose.onNodeWithTag("media-batch-send").assertIsNotEnabled()
                    assertEquals(4, photoIds(api, id).size)
                    fixture.screenshot("native-vibe-publish-held-after-commit")
                    QaResponseGate.releaseMedia()
                }
                fixture.waitAbsent("upload-sheet")
                fixture.waitGalleryCounter(1, 4)
                val after = photoIds(api, id)
                assertEquals(4, after.size)
                assertTrue(after.containsAll(before))
                assertEquals(1, (after - before).size)
                fixture.screenshot("native-vibe-photo-confirmed-once")
            }
        } finally {
            fixture.context.contentResolver.delete(photo, null, null)
        }
    }

    private fun photoIds(api: ChatReadLiveApi, id: String): Set<String> {
        val photos = api.request("design", "meetings/$id/memories").getJSONArray("photos")
        val ids = (0 until photos.length()).map { photos.getJSONObject(it).getString("id") }
        assertEquals(ids.size, ids.toSet().size)
        return ids.toSet()
    }
}
