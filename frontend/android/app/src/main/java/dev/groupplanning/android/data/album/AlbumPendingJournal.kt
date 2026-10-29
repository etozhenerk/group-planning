package dev.groupplanning.android.data.album

import java.io.File
import java.io.IOException
import java.io.RandomAccessFile
import java.nio.channels.OverlappingFileLockException
import java.nio.file.Files

internal class AlbumPendingJournal(private val directory: File) {
    fun acquire(): AlbumPendingLease {
        Files.createDirectories(directory.toPath())
        if (Files.isSymbolicLink(directory.toPath())) throw IOException("Invalid journal directory")
        val lockFile = File(directory, "operation.lock")
        if (Files.isSymbolicLink(lockFile.toPath())) throw IOException("Invalid journal lock")
        val channel = RandomAccessFile(lockFile, "rw").channel
        try {
            val lock = try {
                channel.tryLock()
            } catch (_: OverlappingFileLockException) {
                null
            } ?: throw AlbumSaveFailure(AlbumSaveIssue.Busy)
            return AlbumPendingLease(directory, channel, lock)
        } catch (error: Throwable) {
            try {
                channel.close()
            } catch (cleanup: IOException) {
                error.addSuppressed(cleanup)
            }
            throw error
        }
    }
}
