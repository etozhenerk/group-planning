package dev.groupplanning.android.data.auth

import android.util.AtomicFile
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.session.SessionCipher
import java.io.File
import java.io.IOException
import java.security.GeneralSecurityException
import kotlinx.serialization.SerializationException
import kotlinx.serialization.encodeToString

internal class FileAuthAttemptStorage(file: File, private val cipher: SessionCipher) :
    AuthAttemptStorage {
    private val atomic = AtomicFile(file)

    override fun load(): PendingAuthAttempt? = protect {
        if (!atomic.baseFile.exists() &&
            !File(atomic.baseFile.path + ".bak").exists()
        ) {
            return@protect null
        }
        val bytes = atomic.openRead().use { stream ->
            val buffer = ByteArray(16385)
            var size = 0
            while (size < buffer.size) {
                val count = stream.read(buffer, size, buffer.size - size)
                if (count < 0) break
                size += count
            }
            buffer.copyOf(size)
        }
        if (bytes.size > 16384) throw IOException("Oversized authentication attempt")
        apiJson.decodeFromString<PendingAuthAttempt>(cipher.decrypt(bytes).toString(Charsets.UTF_8))
    }

    override fun save(attempt: PendingAuthAttempt?) = protect {
        if (attempt == null) {
            atomic.delete()
            if (atomic.baseFile.exists()) throw IOException("Attempt removal")
        } else {
            val bytes = cipher.encrypt(apiJson.encodeToString(attempt).toByteArray(Charsets.UTF_8))
            val stream = atomic.startWrite()
            try {
                stream.write(bytes)
                atomic.finishWrite(stream)
            } catch (error: Exception) {
                atomic.failWrite(stream)
                throw error
            }
        }
    }

    private fun <T> protect(block: () -> T): T = try {
        block()
    } catch (_: IOException) {
        throw ClientFailure(FailureKind.Storage)
    } catch (_: GeneralSecurityException) {
        throw ClientFailure(FailureKind.Storage)
    } catch (_: SerializationException) {
        throw ClientFailure(FailureKind.Storage)
    } catch (_: IllegalArgumentException) {
        throw ClientFailure(FailureKind.Storage)
    }
}
