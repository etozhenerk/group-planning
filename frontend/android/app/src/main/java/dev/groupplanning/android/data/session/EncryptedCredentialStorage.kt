package dev.groupplanning.android.data.session

import android.util.AtomicFile
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import dev.groupplanning.android.data.api.apiJson
import java.io.File
import java.io.FileNotFoundException
import java.io.IOException
import java.security.GeneralSecurityException
import kotlinx.serialization.SerializationException
import kotlinx.serialization.encodeToString

internal class EncryptedCredentialStorage(file: File, private val cipher: SessionCipher) :
    CredentialStorage {
    private val file = AtomicFile(file)

    override fun load(): StoredSession? = protect {
        val encoded = try {
            file.openRead().use { it.readBytesUpToLimit() }
        } catch (_: FileNotFoundException) {
            if (file.baseFile.exists()) throw IOException("Unreadable credential file")
            return@protect null
        }
        val plain = cipher.decrypt(encoded)
        try {
            apiJson.decodeFromString<StoredSession>(plain.toString(Charsets.UTF_8))
        } finally {
            plain.fill(0)
        }
    }

    override fun save(credential: StoredSession) = protect {
        val plain = apiJson.encodeToString(credential).toByteArray(Charsets.UTF_8)
        val encoded = try {
            cipher.encrypt(plain)
        } finally {
            plain.fill(0)
        }
        val stream = file.startWrite()
        try {
            stream.write(encoded)
            file.finishWrite(stream)
        } catch (error: Exception) {
            file.failWrite(stream)
            throw error
        }
    }

    override fun clear() = protect {
        file.delete()
        if (file.baseFile.exists()) throw IOException("Could not remove credential")
    }

    private fun java.io.InputStream.readBytesUpToLimit(): ByteArray {
        val buffer = ByteArray(16 * 1024 + 1)
        var count = 0
        while (count < buffer.size) {
            val read = read(buffer, count, buffer.size - count)
            if (read < 0) break
            count += read
        }
        if (count == buffer.size) throw IOException("Credential file exceeds limit")
        return buffer.copyOf(count)
    }

    private fun <T> protect(block: () -> T): T = try {
        block()
    } catch (_: IOException) {
        throw ClientFailure(FailureKind.Storage)
    } catch (_: java.security.ProviderException) {
        throw ClientFailure(FailureKind.Storage)
    } catch (_: GeneralSecurityException) {
        throw ClientFailure(FailureKind.Storage)
    } catch (_: SerializationException) {
        throw ClientFailure(FailureKind.Storage)
    } catch (_: IllegalArgumentException) {
        throw ClientFailure(FailureKind.Storage)
    }
}
