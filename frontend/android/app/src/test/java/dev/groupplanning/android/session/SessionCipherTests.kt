package dev.groupplanning.android.session

import dev.groupplanning.android.data.session.SessionCipher
import dev.groupplanning.android.data.session.SessionKeyProvider
import java.security.GeneralSecurityException
import javax.crypto.KeyGenerator
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertThrows
import org.junit.Test

class SessionCipherTests {
    private val key = KeyGenerator.getInstance("AES").apply { init(256) }.generateKey()
    private val provider = SessionKeyProvider { key }

    @Test fun repeatedEncryptionHasFreshIvAndNoPlaintext() {
        val cipher = SessionCipher(provider, "https://one.test/")
        val plain = "private-session-token".toByteArray()
        val first = cipher.encrypt(plain)
        val second = cipher.encrypt(plain)
        assertFalse(first.contentEquals(second))
        assertFalse(first.toString(Charsets.UTF_8).contains("private-session-token"))
        assertArrayEquals(plain, cipher.decrypt(first))
        assertArrayEquals(plain, cipher.decrypt(second))
    }

    @Test fun tamperingWrongOriginAndMalformedEnvelopeFailClosed() {
        val cipher = SessionCipher(provider, "https://one.test/")
        val blob = cipher.encrypt("secret".toByteArray())
        val corrupted = blob.copyOf().also { it[it.lastIndex] = (it.last().toInt() xor 1).toByte() }
        for (bad in listOf(byteArrayOf(), byteArrayOf(1, 2), corrupted)) {
            assertThrows(GeneralSecurityException::class.java) { cipher.decrypt(bad) }
        }
        assertThrows(GeneralSecurityException::class.java) {
            SessionCipher(provider, "https://two.test/").decrypt(blob)
        }
    }
}
