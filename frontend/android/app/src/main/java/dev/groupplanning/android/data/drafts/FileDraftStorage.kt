package dev.groupplanning.android.data.drafts

import android.util.AtomicFile
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import dev.groupplanning.android.data.api.apiJson
import java.io.File
import java.io.IOException
import java.util.UUID
import kotlinx.serialization.SerializationException
import kotlinx.serialization.encodeToString

internal class FileDraftStorage(private val directory: File) : DraftStorage {
    override fun load(owner: UUID): DraftRecord? = protect {
        val file = file(owner)
        if (!file.baseFile.exists() && !File(file.baseFile.path + ".bak").exists()) {
            return@protect null
        }
        val bytes = file.openRead().use { stream ->
            val buffer = ByteArray(64 * 1024 + 1)
            var size = 0
            while (size < buffer.size) {
                val count = stream.read(buffer, size, buffer.size - size)
                if (count < 0) break
                size += count
            }
            if (size == buffer.size) throw IOException("Oversized draft")
            buffer.copyOf(size)
        }
        apiJson.decodeFromString<DraftRecord>(bytes.toString(Charsets.UTF_8)).also {
            if (it.owner != owner) throw IOException("Wrong draft owner")
        }
    }

    override fun save(record: DraftRecord) = protect {
        if (!directory.exists() && !directory.mkdirs()) throw IOException("Draft directory")
        val file = file(record.owner)
        val stream = file.startWrite()
        try {
            stream.write(apiJson.encodeToString(record).toByteArray(Charsets.UTF_8))
            file.finishWrite(stream)
        } catch (error: Exception) {
            file.failWrite(stream)
            throw error
        }
    }

    override fun remove(owner: UUID) = protect {
        val file = file(owner)
        file.delete()
        if (file.baseFile.exists()) throw IOException("Draft removal")
    }

    private fun file(owner: UUID): AtomicFile = AtomicFile(File(directory, "$owner.json"))

    private fun <T> protect(block: () -> T): T = try {
        block()
    } catch (_: IOException) {
        throw ClientFailure(FailureKind.Storage)
    } catch (_: SerializationException) {
        throw ClientFailure(FailureKind.Storage)
    } catch (_: IllegalArgumentException) {
        throw ClientFailure(FailureKind.Storage)
    }
}
