package dev.groupplanning.android.data.album

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import java.io.File
import java.io.IOException
import java.util.UUID

internal class MediaStoreAlbumGallery(
    private val context: Context,
    journalDirectory: File = File(context.noBackupFilesDir, "album-pending-v1"),
) : AlbumGallery {
    private val journal = AlbumPendingJournal(journalDirectory)
    private val rows = AlbumMediaStoreRows(context.contentResolver, context.packageName)

    override fun requirePermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q &&
            context.checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) !=
            PackageManager.PERMISSION_GRANTED
        ) {
            throw AlbumSaveFailure(AlbumSaveIssue.PermissionRequired)
        }
    }

    override fun begin(): AlbumGalleryOperation {
        requirePermission()
        val record =
            AlbumPendingRecord(1, UUID.randomUUID().toString(), AlbumPendingPhase.Preparing)
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            return MediaStoreAlbumOperation(context.contentResolver, rows, record, null)
        }
        val lease = journal.acquire()
        try {
            recover(lease)
            lease.write(record)
            return MediaStoreAlbumOperation(context.contentResolver, rows, record, lease)
        } catch (error: Throwable) {
            try {
                lease.close()
            } catch (cleanup: IOException) {
                error.addSuppressed(cleanup)
            }
            throw error
        }
    }

    // Call on an IO dispatcher. Production currently invokes recovery from begin(),
    // not automatically at application startup.
    fun recoverPending() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return
        journal.acquire().use(::recover)
    }

    private fun recover(lease: AlbumPendingLease) {
        lease.read()?.let(rows::recover)
        lease.clear()
    }
}
