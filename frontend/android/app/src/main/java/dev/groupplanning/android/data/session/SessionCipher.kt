package dev.groupplanning.android.data.session

import java.security.GeneralSecurityException
import javax.crypto.Cipher
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

internal fun interface SessionKeyProvider {
    fun key(): SecretKey
}

internal class SessionCipher(private val keys: SessionKeyProvider, private val context: String) {
    fun encrypt(plaintext: ByteArray): ByteArray {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, keys.key())
        cipher.updateAAD(context.toByteArray(Charsets.UTF_8))
        check(cipher.iv.size == IV_BYTES)
        return byteArrayOf(VERSION) + cipher.iv + cipher.doFinal(plaintext)
    }

    fun decrypt(encoded: ByteArray): ByteArray {
        if (encoded.size < 1 + IV_BYTES + TAG_BITS / 8 || encoded[0] != VERSION) {
            throw GeneralSecurityException("Invalid credential envelope")
        }
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val iv = encoded.copyOfRange(1, 1 + IV_BYTES)
        cipher.init(Cipher.DECRYPT_MODE, keys.key(), GCMParameterSpec(TAG_BITS, iv))
        cipher.updateAAD(context.toByteArray(Charsets.UTF_8))
        return cipher.doFinal(encoded, 1 + IV_BYTES, encoded.size - 1 - IV_BYTES)
    }

    private companion object {
        const val VERSION: Byte = 1
        const val IV_BYTES = 12
        const val TAG_BITS = 128
    }
}
