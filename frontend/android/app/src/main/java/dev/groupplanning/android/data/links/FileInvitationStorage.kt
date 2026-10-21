package dev.groupplanning.android.data.links

import android.util.AtomicFile
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import dev.groupplanning.android.data.session.SessionCipher
import java.io.File
import java.io.IOException
import java.security.GeneralSecurityException

internal class FileInvitationStorage(file: File, private val cipher: SessionCipher) :
    InvitationStorage {
    private val atomic = AtomicFile(file)

    override fun load(): String? = protect {
        if (!atomic.baseFile.exists() &&
            !File(atomic.baseFile.path + ".bak").exists()
        ) {
            return@protect null
        }
        val bytes = atomic.openRead().use { stream ->
            val buffer = ByteArray(513)
            var size = 0
            while (size < buffer.size) {
                val count = stream.read(buffer, size, buffer.size - size)
                if (count < 0) break
                size += count
            }
            buffer.copyOf(size)
        }
        if (bytes.size > 512) throw IOException("Oversized invitation context")
        cipher.decrypt(bytes).toString(Charsets.UTF_8)
    }

    override fun save(token: String?) = protect {
        if (token == null) {
            atomic.delete()
            if (atomic.baseFile.exists()) throw IOException("Context removal")
        } else {
            val bytes = cipher.encrypt(token.toByteArray(Charsets.UTF_8))
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
    }
}
