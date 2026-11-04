package dev.groupplanning.android

import android.content.ContentValues
import android.provider.MediaStore
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.test.uiautomator.By
import androidx.test.uiautomator.Until
import dev.groupplanning.android.qaCreateEmptyComposeRule as createEmptyComposeRule
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class NativePDFDelayedUiTests {
    @get:Rule(order = 0)
    val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule(order = 1)
    val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Before fun configure() = fixture.configure()

    @After fun releaseGate() = QaResponseGate.releaseMedia()

    @Test fun pdfPreviewWaitsForConfirmedPublishResponse() {
        val id = "deb00000-0000-4000-8000-000000000002"
        val api = ChatReadLiveApi(fixture.context)
        val resolver = fixture.context.contentResolver
        val name = "Задержанное подтверждение.pdf"
        val document = checkNotNull(
            resolver.insert(
                MediaStore.Downloads.EXTERNAL_CONTENT_URI,
                ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, name)
                    put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf")
                    put(MediaStore.MediaColumns.IS_PENDING, 1)
                },
            ),
        )
        try {
            checkNotNull(resolver.openOutputStream(document)).use {
                it.write("%PDF-1.4\n% Somewhere delay fixture\n%%EOF\n".toByteArray())
            }
            resolver.update(
                document,
                ContentValues().apply { put(MediaStore.MediaColumns.IS_PENDING, 0) },
                null,
                null,
            )
            QaResponseGate.holdPublication("/api/v1/meetings/$id/media/")
            fixture.launch("design").use {
                fixture.waitText("Настолки у Саши")
                compose.onNodeWithText("Настолки у Саши").performScrollTo().performClick()
                fixture.waitTag("meeting-add")
                compose.onNodeWithTag("meeting-add").performClick()
                compose.onNodeWithTag("add-file").performClick()
                checkNotNull(
                    fixture.device.wait(Until.findObject(By.text(name)), 10_000),
                ).click()
                fixture.waitTag("upload-sheet")
                compose.onNodeWithText("Отправить").performScrollTo().performClick()
                compose.waitUntil(15_000) { QaResponseGate.mediaEntered }
                fixture.waitTag("upload-sheet")
                compose.onNodeWithContentDescription("Отправить").assertIsNotEnabled()
                assertEquals(1, matchingFiles(api, id, name))
                fixture.screenshot("native-pdf-publish-held-after-commit")
                QaResponseGate.releaseMedia()
                fixture.waitAbsent("upload-sheet")
                fixture.waitText(name)
                assertEquals(1, matchingFiles(api, id, name))
                fixture.screenshot("native-pdf-delay-confirmed-once")
            }
        } finally {
            resolver.delete(document, null, null)
        }
    }

    private fun matchingFiles(api: ChatReadLiveApi, id: String, name: String): Int {
        val entries = api.request("design", "meetings/$id/feed").getJSONArray("entries")
        return (0 until entries.length()).sumOf { index ->
            val files = entries.getJSONObject(index).getJSONObject("payload")
                .optJSONArray("attachments")
            if (files == null) {
                0
            } else {
                (0 until files.length()).count {
                    files.getJSONObject(it).getString("file_name") == name
                }
            }
        }
    }
}
