package dev.groupplanning.android.data.session

import android.content.Context
import dev.groupplanning.android.data.api.ApiOrigin
import java.io.File
import java.security.MessageDigest

internal object AndroidCredentials {
    fun create(context: Context, origin: ApiOrigin): CredentialStorage {
        val identity = origin.url.toString()
        val digest = MessageDigest.getInstance(
            "SHA-256",
        ).digest(identity.toByteArray(Charsets.UTF_8))
        val key = digest.joinToString("") { "%02x".format(it) }
        val file = File(context.noBackupFilesDir, "session-$key.bin")
        return EncryptedCredentialStorage(
            file,
            SessionCipher(AndroidSessionKey("somewhere.session.$key"), identity),
        )
    }
}
