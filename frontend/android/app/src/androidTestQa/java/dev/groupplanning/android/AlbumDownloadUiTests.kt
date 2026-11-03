package dev.groupplanning.android

import android.content.ContentResolver
import android.content.ContentUris
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import androidx.compose.ui.test.assertContentDescriptionEquals
import androidx.compose.ui.test.click
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasScrollToIndexAction
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performScrollToIndex
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.swipeLeft
import androidx.test.core.app.ActivityScenario
import androidx.test.filters.SdkSuppress
import dev.groupplanning.android.qaCreateEmptyComposeRule as createEmptyComposeRule
import java.security.MessageDigest
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

@SdkSuppress(minSdkVersion = 30)
class AlbumDownloadUiTests {
    @get:Rule(order = 0)
    val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule(order = 1)
    val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)
    private var before = emptySet<Uri>()

    @Before fun configure() {
        fixture.configure()
        QaAlbumDownloadProbe.reset()
        before = ownRows().keys
    }

    @After fun cleanup() {
        QaResponseGate.unavailableMediaPrefix = null
        QaAlbumDownloadProbe.reset()
        (ownRows().keys - before).forEach { fixture.context.contentResolver.delete(it, null, null) }
    }

    @Test fun allPagesWarmBeforeOfflineLastPhotoAndSave103Originals() {
        QaChatProbe.reset()
        openAlbum(count = 103, scenario = "album-preload-owner").use {
            compose.waitUntil(30_000) {
                QaChatProbe.requests.filter { it.endsWith("/content") }.toSet().size == 103
            }
            Thread.sleep(1_000)
            val beforeContent = QaChatProbe.requests.filter { it.endsWith("/content") }
            fixture.screenshot("album-preload-103-ready")
            QaResponseGate.unavailableMediaPrefix = "/api/v1/meetings/"
            compose.onNodeWithContentDescription("Все фото").performClick()
            compose.onNode(
                hasScrollToIndexAction() and hasAnyAncestor(hasTestTag("memory-gallery")),
            ).performScrollToIndex(102)
            compose.onNodeWithContentDescription(
                fixture.context.getString(R.string.memories_count, 103, 103),
            ).performTouchInput { click() }
            fixture.waitTag("memory-fullscreen")
            compose.onNodeWithText("103 / 103", substring = true).assertExists()
            fixture.screenshot("album-preload-103-offline")
            fixture.device.pressBack()
            fixture.device.pressBack()
            fixture.waitTag("photo-stack")
            compose.onNodeWithTag("photo-stack").performTouchInput { swipeLeft() }
            fixture.waitText("1 / 103")
            assertEquals(beforeContent, QaChatProbe.requests.filter { it.endsWith("/content") })
            fixture.screenshot("album-preload-offline-cycle")
            QaResponseGate.unavailableMediaPrefix = null
            compose.onNodeWithTag("album-save").performScrollTo().performClick()
            fixture.waitText("Фотографии сохранены")
            verifySavedOriginals(expected = 103)
            fixture.screenshot("album-download-103-saved")
        }
    }

    @Test fun adjacentActionSavesAllOriginalsAndKeepsSelectedPhoto() {
        openAlbum().use {
            compose.onNodeWithTag("photo-stack").performTouchInput { swipeLeft() }
            fixture.waitText("2 / 3")
            val add = compose.onNodeWithTag("album-add").fetchSemanticsNode().boundsInRoot
            val save = compose.onNodeWithTag("album-save").fetchSemanticsNode().boundsInRoot
            assertEquals(add.top, save.top, 1f)
            assertEquals(add.height, save.height, 1f)
            assertEquals(add.width, save.width, 1f)
            assertTrue(add.right < save.left)
            compose.onNodeWithTag("album-save")
                .assertContentDescriptionEquals("Сохранить все фото")
            fixture.screenshot("album-download-ready")
            compose.onNodeWithTag("album-save").performClick()
            fixture.waitText("Фотографии сохранены")
            fixture.waitText("2 / 3")
            verifySavedOriginals()
            fixture.screenshot("album-download-saved")
        }
    }

    @Test fun cancellationAndLeavingDuringPreparationDoNotPublishPhotos() {
        openAlbum().use {
            compose.onNodeWithTag("photo-stack").performTouchInput { swipeLeft() }
            fixture.waitText("2 / 3")
            val stack = compose.onNodeWithTag("photo-stack").fetchSemanticsNode().boundsInRoot
            val button = compose.onNodeWithTag("album-save").fetchSemanticsNode().boundsInRoot
            QaAlbumDownloadProbe.holdSnapshot()
            compose.onNodeWithTag("album-save").performClick()
            compose.waitUntil(15_000) { QaAlbumDownloadProbe.snapshotEntered }
            compose.onNodeWithTag("album-save")
                .assertContentDescriptionEquals("Отменить подготовку фотографий")
            val preparing = compose.onNodeWithTag("album-save").fetchSemanticsNode().boundsInRoot
            assertEquals(button.top, preparing.top, 1f)
            assertEquals(button.height, preparing.height, 1f)
            assertEquals(
                stack.top,
                compose.onNodeWithTag("photo-stack").fetchSemanticsNode().boundsInRoot.top,
                1f,
            )
            fixture.screenshot("album-download-preparing")
            compose.onNodeWithTag("album-save").performClick()
            QaAlbumDownloadProbe.release()
            compose.onNodeWithTag("album-save")
                .assertContentDescriptionEquals("Сохранить все фото")
            fixture.waitText("2 / 3")
            assertEquals(before, ownRows().keys)
            fixture.screenshot("album-download-cancelled")
            QaAlbumDownloadProbe.holdSnapshot()
            compose.onNodeWithTag("album-save").performClick()
            compose.waitUntil(15_000) { QaAlbumDownloadProbe.snapshotEntered }
            fixture.device.pressBack()
            fixture.waitAbsent("memory-gallery")
            QaAlbumDownloadProbe.release()
            compose.waitForIdle()
            assertEquals(before, ownRows().keys)
        }
    }

    @Test fun networkFailureRetainsAlbumAndRetrySavesOriginals() {
        openAlbum().use {
            QaAlbumDownloadProbe.rejectSnapshot = true
            compose.onNodeWithTag("album-save").performClick()
            fixture.waitText("Не удалось подготовить фотографии. Попробуйте ещё раз.")
            fixture.waitText("1 / 3")
            assertEquals(before, ownRows().keys)
            fixture.screenshot("album-download-error")
            QaAlbumDownloadProbe.rejectSnapshot = false
            compose.onNodeWithTag("album-save").assertContentDescriptionEquals("Повторить")
                .performClick()
            fixture.waitText("Фотографии сохранены")
            verifySavedOriginals()
        }
    }

    private fun openAlbum(
        count: Int = 3,
        scenario: String = "memories",
    ): ActivityScenario<MainActivity> {
        val activity = fixture.launch(scenario)
        fixture.waitTag("meetings-list")
        compose.onNodeWithText("Прошедшие").performClick()
        fixture.waitText("Суббота у озера")
        compose.onNodeWithText("Суббота у озера").performScrollTo().performClick()
        fixture.waitText("Открыть вайб")
        compose.onNodeWithText("Открыть вайб").performClick()
        fixture.waitText("1 / $count")
        fixture.waitTag("album-save")
        return activity
    }

    private fun verifySavedOriginals(expected: Int = 3) {
        val created = ownRows().filterKeys { it !in before }
        assertEquals(expected, QaAlbumDownloadProbe.photoIds.size)
        assertEquals(QaAlbumDownloadProbe.photoIds.size, created.size)
        for (id in QaAlbumDownloadProbe.photoIds) {
            val (uri, row) = created.entries.single { it.value.first.contains(id) }
            assertEquals(0, row.second)
            val bytes = fixture.context.contentResolver.openInputStream(uri).use {
                checkNotNull(it).readBytes()
            }
            val hash = MessageDigest.getInstance("SHA-256").digest(bytes)
                .joinToString("") { "%02x".format(it) }
            assertEquals(checkNotNull(QaAlbumDownloadProbe.contentHashes[id]), hash)
        }
    }

    private fun ownRows(): Map<Uri, Pair<String, Int>> {
        val fields = arrayOf(
            MediaStore.Images.Media._ID,
            MediaStore.Images.Media.DISPLAY_NAME,
            MediaStore.Images.Media.IS_PENDING,
        )
        val args = Bundle().apply {
            putString(
                ContentResolver.QUERY_ARG_SQL_SELECTION,
                "${MediaStore.Images.Media.OWNER_PACKAGE_NAME} = ? AND " +
                    "${MediaStore.Images.Media.RELATIVE_PATH} = ?",
            )
            putStringArray(
                ContentResolver.QUERY_ARG_SQL_SELECTION_ARGS,
                arrayOf(fixture.context.packageName, "Pictures/somewhere/"),
            )
            putInt(MediaStore.QUERY_ARG_MATCH_PENDING, MediaStore.MATCH_INCLUDE)
        }
        val collection = MediaStore.Images.Media.EXTERNAL_CONTENT_URI
        return fixture.context.contentResolver.query(collection, fields, args, null).use { cursor ->
            checkNotNull(cursor)
            buildMap {
                while (cursor.moveToNext()) {
                    put(
                        ContentUris.withAppendedId(collection, cursor.getLong(0)),
                        cursor.getString(1) to cursor.getInt(2),
                    )
                }
            }
        }
    }
}
