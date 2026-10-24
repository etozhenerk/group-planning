package dev.groupplanning.android.data.auth

import java.security.MessageDigest
import java.security.SecureRandom
import java.util.Base64

internal class AuthProof(val verifier: String) {
    val challenge: String =
        encode(MessageDigest.getInstance("SHA-256").digest(verifier.toByteArray(Charsets.US_ASCII)))
    override fun toString(): String = "AuthProof(redacted)"

    companion object {
        fun generate(): AuthProof = AuthProof(encode(ByteArray(32).also(SecureRandom()::nextBytes)))
        private fun encode(bytes: ByteArray): String =
            Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
    }
}
