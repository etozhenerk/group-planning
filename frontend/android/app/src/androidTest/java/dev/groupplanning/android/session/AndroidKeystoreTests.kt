package dev.groupplanning.android.session

import android.content.Context
import android.util.AtomicFile
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import dev.groupplanning.android.data.api.models.ApiInstant
import dev.groupplanning.android.data.session.AndroidSessionKey
import dev.groupplanning.android.data.session.EncryptedCredentialStorage
import dev.groupplanning.android.data.session.SessionCipher
import dev.groupplanning.android.data.session.StoredSession
import java.io.File
import java.security.KeyStore
import java.util.UUID
import org.junit.After
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class AndroidKeystoreTests {
    private lateinit var directory: File
    private lateinit var alias: String
    private lateinit var file: File
    private val credential = StoredSession("device-test-secret", ApiInstant("2099-01-01T00:00:00Z"))

    @Before fun prepare() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val id = UUID.randomUUID().toString()
        directory = File(context.noBackupFilesDir, "keystore-test-$id").apply { mkdirs() }
        file = File(directory, "session.bin")
        alias = "somewhere.test.$id"
    }

    @After fun cleanup() {
        directory.deleteRecursively()
        KeyStore.getInstance("AndroidKeyStore").apply {
            load(null)
            deleteEntry(alias)
        }
    }

    @Test fun actualKeystorePersistsEncryptedSecretAndUsesFreshIv() {
        val storage = storage()
        assertNull(storage.load())
        storage.save(credential)
        val first = file.readBytes()
        assertFalse(first.toString(Charsets.UTF_8).contains(credential.token))
        assertEquals(credential.token, storage().load()?.token)
        storage.save(credential)
        assertFalse(first.contentEquals(file.readBytes()))
        assertEquals(credential.expiresAt, storage().load()?.expiresAt)
        val key = AndroidSessionKey(alias).key()
        assertNull(key.encoded)
        storage.clear()
        assertNull(storage().load())
        assertFalse(file.exists())
    }

    @Test fun tamperingAndMissingKeyCannotFallBackToPlaintext() {
        storage().save(credential)
        val encrypted = file.readBytes()
        file.writeBytes(
            encrypted.copyOf().also {
                it[it.lastIndex] =
                    (it.last().toInt() xor 1).toByte()
            },
        )
        assertEquals(
            FailureKind.Storage,
            assertThrows(ClientFailure::class.java) {
                storage().load()
            }.kind,
        )
        file.writeBytes(encrypted)
        KeyStore.getInstance("AndroidKeyStore").apply {
            load(null)
            deleteEntry(alias)
        }
        assertThrows(ClientFailure::class.java) { storage().load() }
    }

    @Test fun ciphertextCannotBeMovedToAnotherOrigin() {
        val first = storage()
        first.save(credential)
        val other =
            EncryptedCredentialStorage(
                file,
                SessionCipher(AndroidSessionKey(alias), "https://other.test/"),
            )
        assertThrows(ClientFailure::class.java) { other.load() }
        assertEquals(credential.token, first.load()?.token)
    }

    @Test fun interruptedAtomicWriteKeepsPreviousSession() {
        val storage = storage()
        storage.save(credential)
        val previous = file.readBytes()
        val atomic = AtomicFile(file)
        val stream = atomic.startWrite()
        stream.write(byteArrayOf(1, 2, 3))
        atomic.failWrite(stream)
        assertEquals(credential.token, storage().load()?.token)
        assertArrayEquals(previous, file.readBytes())
    }

    @Test fun oversizedFileIsRejectedWithoutAuthentication() {
        file.writeBytes(ByteArray(16 * 1024 + 1))
        assertEquals(
            FailureKind.Storage,
            assertThrows(ClientFailure::class.java) {
                storage().load()
            }.kind,
        )
        storage().clear()
        assertTrue(directory.listFiles().orEmpty().isEmpty())
    }

    @Test fun invitationContextIsEncryptedBoundToOriginAndRemovedOnClose() {
        val token = "QUFBQUFBQUFBQUFBQUFBQQ"
        val cipher = SessionCipher(AndroidSessionKey(alias), "https://example.test/")
        val storage = dev.groupplanning.android.data.links.FileInvitationStorage(file, cipher)
        storage.save(token)
        assertFalse(file.readText().contains(token))
        assertEquals(
            token,
            dev.groupplanning.android.data.links.FileInvitationStorage(file, cipher).load(),
        )
        val other = dev.groupplanning.android.data.links.FileInvitationStorage(
            file,
            SessionCipher(AndroidSessionKey(alias), "https://other.test/"),
        )
        assertThrows(ClientFailure::class.java) { other.load() }
        storage.save(null)
        assertNull(storage.load())
    }

    private fun storage(): EncryptedCredentialStorage = EncryptedCredentialStorage(
        file,
        SessionCipher(AndroidSessionKey(alias), "https://example.test/"),
    )
}
