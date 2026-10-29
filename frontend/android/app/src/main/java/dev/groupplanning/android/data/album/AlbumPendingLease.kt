package dev.groupplanning.android.data.album

import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.nio.channels.FileChannel
import java.nio.channels.FileLock
import java.nio.file.Files
import java.nio.file.StandardCopyOption
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

internal class AlbumPendingLease(
    directory: File,
    private val channel: FileChannel,
    private val lock: FileLock,
) : AutoCloseable {
    private val record = File(directory, "active.json")
    private val temporary = File(directory, "active.new")
    private val json = Json { encodeDefaults = true }
    private var closed = false

    fun read(): AlbumPendingRecord? {
        check(!closed)
        rejectLink(record)
        if (!record.exists()) return null
        if (record.length() !in 1..MAXIMUM_BYTES) throw IOException("Invalid journal size")
        val bytes = record.inputStream().use { input ->
            val buffer = ByteArray(MAXIMUM_BYTES.toInt() + 1)
            var used = 0
            while (used < buffer.size) {
                val count = input.read(buffer, used, buffer.size - used)
                if (count < 0) break
                used += count
            }
            buffer.copyOf(used)
        }
        if (bytes.size > MAXIMUM_BYTES) throw IOException("Invalid journal size")
        return try {
            json.decodeFromString<AlbumPendingRecord>(bytes.toString(Charsets.UTF_8))
        } catch (error: IllegalArgumentException) {
            throw IOException("Invalid journal record", error)
        }
    }

    fun write(value: AlbumPendingRecord) {
        check(!closed)
        rejectLink(record)
        rejectLink(temporary)
        val bytes = json.encodeToString(value).toByteArray(Charsets.UTF_8)
        if (bytes.size > MAXIMUM_BYTES) throw IOException("Journal size exceeded")
        FileOutputStream(temporary).use {
            it.write(bytes)
            it.fd.sync()
        }
        // No non-atomic fallback: an insert must never follow an ambiguous intent write.
        Files.move(
            temporary.toPath(),
            record.toPath(),
            StandardCopyOption.ATOMIC_MOVE,
            StandardCopyOption.REPLACE_EXISTING,
        )
    }

    fun clear() {
        check(!closed)
        Files.deleteIfExists(record.toPath())
        Files.deleteIfExists(temporary.toPath())
    }

    override fun close() {
        if (closed) return
        closed = true
        try {
            lock.release()
        } finally {
            channel.close()
        }
    }

    private fun rejectLink(file: File) {
        if (Files.isSymbolicLink(file.toPath())) throw IOException("Invalid journal entry")
    }

    private companion object {
        const val MAXIMUM_BYTES = 4096L
    }
}
