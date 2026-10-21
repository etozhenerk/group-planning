package dev.groupplanning.android.data.outbox

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

internal class FileMessageStorage(file: File, private val cipher: SessionCipher) : MessageStorage {
    private val atomic = AtomicFile(file)

    override fun load(): List<MessageRecord> = protect {
        if (!atomic.baseFile.exists() && !File(atomic.baseFile.path + ".bak").exists()) {
            return@protect emptyList()
        }
        val bytes = atomic.openRead().use { stream ->
            val buffer = ByteArray(1_048_577)
            var size = 0
            while (size < buffer.size) {
                val count = stream.read(buffer, size, buffer.size - size)
                if (count < 0) break
                size += count
            }
            buffer.copyOf(size)
        }
        if (bytes.size > 1_048_576) throw IOException("Oversized outbox")
        apiJson.decodeFromString(cipher.decrypt(bytes).toString(Charsets.UTF_8))
    }

    override fun save(records: List<MessageRecord>) = protect {
        if (records.isEmpty()) {
            atomic.delete()
            if (atomic.baseFile.exists()) throw IOException("Outbox removal")
        } else {
            val bytes = cipher.encrypt(apiJson.encodeToString(records).toByteArray(Charsets.UTF_8))
            if (bytes.size > 1_048_576) throw IOException("Oversized outbox")
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
