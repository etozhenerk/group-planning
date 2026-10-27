package dev.groupplanning.android.session

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.models.ApiInstant
import dev.groupplanning.android.data.outbox.FileMessageStorage
import dev.groupplanning.android.data.outbox.MessageRecord
import dev.groupplanning.android.data.outbox.PendingMessage
import dev.groupplanning.android.data.session.AndroidSessionKey
import dev.groupplanning.android.data.session.SessionCipher
import java.io.File
import java.security.KeyStore
import java.util.UUID
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertThrows
import org.junit.Test

class MessageQueueStorageTests {
    @Test fun encryptedQueueAndDraftSurviveReopenAndInterruptedAtomicWrite() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val alias = "somewhere.queue-test.${UUID.randomUUID()}"
        val directory = File(context.noBackupFilesDir, alias).apply { mkdirs() }
        val file = File(directory, "queue.bin")
        val cipher = SessionCipher(AndroidSessionKey(alias), "https://example.test/")
        try {
            val first =
                PendingMessage(
                    UUID.randomUUID(),
                    "Личный текст",
                    ApiInstant("2026-10-27T12:00:00Z"),
                )
            val second = first.copy(key = UUID.randomUUID(), text = "Второе сообщение")
            val record =
                MessageRecord(
                    UUID.randomUUID(),
                    UUID.randomUUID(),
                    "Новый черновик",
                    queue = listOf(first, second),
                )
            FileMessageStorage(file, cipher).save(listOf(record))
            assertFalse(file.readText().contains(first.text))
            assertFalse(file.readText().contains(record.draft))
            File(file.path + ".new").writeText("interrupted")
            assertEquals(listOf(record), FileMessageStorage(file, cipher).load())
            val corrupted = file.readBytes().also {
                it[it.lastIndex] =
                    (it.last().toInt() xor 1).toByte()
            }
            file.writeBytes(corrupted)
            assertThrows(ClientFailure::class.java) { FileMessageStorage(file, cipher).load() }
        } finally {
            directory.deleteRecursively()
            KeyStore.getInstance("AndroidKeyStore").apply {
                load(null)
                deleteEntry(alias)
            }
        }
    }
}
