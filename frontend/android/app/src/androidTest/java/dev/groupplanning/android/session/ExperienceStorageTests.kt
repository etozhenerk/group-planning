package dev.groupplanning.android.session

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.media.MediaStorage
import dev.groupplanning.android.data.media.SelectedMedia
import dev.groupplanning.android.data.repository.EmojiRepository
import dev.groupplanning.android.data.session.AndroidSessionKey
import dev.groupplanning.android.data.session.SessionCipher
import dev.groupplanning.android.data.support.SavedScreenshot
import dev.groupplanning.android.data.support.SupportDraft
import dev.groupplanning.android.data.support.SupportDraftStorage
import java.io.File
import java.security.KeyStore
import java.util.UUID
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class ExperienceStorageTests {
    private lateinit var context: Context
    private lateinit var directory: File
    private lateinit var alias: String

    @Before fun prepare() {
        context = ApplicationProvider.getApplicationContext()
        alias = "somewhere.experience-test.${UUID.randomUUID()}"
        directory = File(context.noBackupFilesDir, alias).apply { mkdirs() }
    }

    @After fun cleanup() {
        directory.deleteRecursively()
        KeyStore.getInstance("AndroidKeyStore").apply {
            load(null)
            deleteEntry(alias)
        }
    }

    @Test fun selectedBytesAndRequestIdsSurviveAStorageReopenAndRevokeOnlyOneMeeting() {
        val cipher = SessionCipher(AndroidSessionKey(alias), "https://example.test/")
        val storage = MediaStorage(directory, cipher)
        val item = SelectedMedia(
            UUID.randomUUID().toString(),
            UUID.randomUUID().toString(),
            UUID.randomUUID().toString(),
            UUID.randomUUID().toString(),
            "private-photo.jpg",
            "image/jpeg",
            13,
            "message",
        )
        val other = item.copy(
            key = UUID.randomUUID().toString(),
            meeting = UUID.randomUUID().toString(),
        )
        val bytes = "private-photo".toByteArray()
        storage.save(item, bytes)
        storage.save(other, bytes)
        assertFalse(File(directory, item.key + ".bytes").readText().contains("private-photo"))
        assertFalse(File(directory, item.key + ".json").readText().contains(item.fileName))
        val reopened = MediaStorage(directory, cipher)
        assertEquals(item, reopened.records(item.owner, item.meeting).single())
        assertArrayEquals(bytes, reopened.bytes(item))
        reopened.save(item.copy(published = true))
        assertTrue(reopened.records(item.owner, item.meeting).single().published)
        reopened.clear(UUID.fromString(item.meeting))
        assertTrue(reopened.records(item.owner, item.meeting).isEmpty())
        assertEquals(other, reopened.records(other.owner, other.meeting).single())
        val foreign =
            MediaStorage(directory, SessionCipher(AndroidSessionKey(alias), "https://other.test/"))
        assertThrows(ClientFailure::class.java) { foreign.records(other.owner, other.meeting) }
        reopened.clear()
        assertFalse(directory.exists())
    }

    @Test fun feedbackFrozenPayloadAndScreenshotAreEncryptedAndRestorable() = runBlocking {
        val file = File(directory, "feedback.bin")
        val cipher = SessionCipher(AndroidSessionKey(alias), "https://example.test/")
        val value = SupportDraft(
            "request-key",
            "private-feedback-body",
            SavedScreenshot("screenshot.png", "image/png", "cHJpdmF0ZS1waG90bw=="),
        )
        SupportDraftStorage(file, cipher).save(value)
        assertFalse(file.readText().contains("private-feedback-body"))
        assertEquals(value, SupportDraftStorage(file, cipher).load())
        SupportDraftStorage(file, cipher).save(null)
        assertFalse(file.exists())
    }

    @Test fun fullRussianEmojiCatalogIsBundledAndRecentSelectionPersists() = runBlocking {
        val repository = EmojiRepository(context)
        val catalog = repository.catalog()
        assertEquals(3944, catalog.size)
        assertTrue(catalog.any { it.emoji == "❤️" && it.name.contains("сердце") })
        repository.used("❤️")
        assertEquals("❤️", EmojiRepository(context).recent().first())
    }
}
