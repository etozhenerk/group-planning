package dev.groupplanning.android

import android.content.ContentProvider
import android.content.ContentResolver
import android.content.ContentValues
import android.database.Cursor
import android.net.Uri
import android.os.Bundle
import android.os.CancellationSignal
import androidx.test.filters.SdkSuppress
import androidx.test.platform.app.InstrumentationRegistry
import dev.groupplanning.android.data.album.AlbumMediaStoreRows
import dev.groupplanning.android.data.album.AlbumPendingJournal
import dev.groupplanning.android.data.album.AlbumPendingPhase
import dev.groupplanning.android.data.album.AlbumPendingRecord
import dev.groupplanning.android.data.album.AlbumPhoto
import dev.groupplanning.android.data.album.MediaStoreAlbumGallery
import dev.groupplanning.android.data.album.MediaStoreAlbumOperation
import java.io.File
import java.io.IOException
import java.util.UUID
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

@SdkSuppress(minSdkVersion = 30)
class AlbumDiscardRecoveryDeviceTests {
    private val context = InstrumentationRegistry.getInstrumentation().targetContext
    private val fixture = AlbumRecoveryFixture(context)

    @Test fun lostInsertReplyIsRecoveredBeforeJournalIsCleared() = runBlocking(Dispatchers.IO) {
        verifyLostReply(failQuery = false, ignoreDelete = false)
    }

    @Test fun failedQueryRetainsLostInsertIntentAndReleasesLock() = runBlocking(Dispatchers.IO) {
        verifyLostReply(failQuery = true, ignoreDelete = false)
    }

    @Test fun incompleteDeleteKeepsIntentAndReleasesLock() = runBlocking(Dispatchers.IO) {
        verifyLostReply(failQuery = false, ignoreDelete = true)
    }

    private suspend fun verifyLostReply(failQuery: Boolean, ignoreDelete: Boolean) {
        val directory = File(context.noBackupFilesDir, "qa-album-lost-reply-${UUID.randomUUID()}")
        val journal = AlbumPendingJournal(directory)
        val record = AlbumPendingRecord(
            1,
            UUID.randomUUID().toString(),
            AlbumPendingPhase.Preparing,
        )
        val file = fixture.photoFile()
        val proxy = LostReplyProvider(fixture.resolver, failQuery, ignoreDelete)
        val lease = journal.acquire()
        lease.write(record)
        val operation = MediaStoreAlbumOperation(
            fixture.resolver,
            AlbumMediaStoreRows(ContentResolver.wrap(proxy), context.packageName),
            record,
            lease,
        )
        try {
            val stage = runCatching {
                operation.stage(AlbumPhoto(UUID.randomUUID(), "image/jpeg", file.length()), file)
            }
            assertTrue(stage.exceptionOrNull() is IOException)
            val inserted = checkNotNull(proxy.created)
            assertTrue(fixture.exists(inserted.toString()))
            val discard = runCatching { operation.discard() }
            if (failQuery || ignoreDelete) {
                assertTrue(discard.exceptionOrNull() is IOException)
                assertTrue(fixture.exists(inserted.toString()))
                // Reacquiring proves that a failed cleanup did not retain the process lock.
                journal.acquire().use { assertEquals(record, it.read()) }
            } else {
                assertTrue(discard.isSuccess)
                assertFalse(fixture.exists(inserted.toString()))
                journal.acquire().use { assertEquals(null, it.read()) }
            }
            val gallery = MediaStoreAlbumGallery(context, directory)
            gallery.recoverPending()
            gallery.recoverPending()
            assertFalse(fixture.exists(inserted.toString()))
            assertFalse(File(directory, "active.json").exists())
        } finally {
            operation.discard()
            lease.close()
            proxy.created?.let(fixture::delete)
            journal.acquire().use { it.clear() }
            File(directory, "operation.lock").delete()
            directory.delete()
            file.delete()
        }
    }
}

private class LostReplyProvider(
    private val real: ContentResolver,
    private val failQuery: Boolean,
    private val ignoreDelete: Boolean,
) : ContentProvider() {
    var created: Uri? = null
        private set

    override fun onCreate() = true

    override fun getType(uri: Uri): String? = real.getType(uri)

    override fun insert(uri: Uri, values: ContentValues?): Uri? {
        created = checkNotNull(real.insert(uri, values))
        // The row exists in the real provider, but its reply never reaches the operation.
        return null
    }

    override fun query(
        uri: Uri,
        projection: Array<out String>?,
        queryArgs: Bundle?,
        cancellationSignal: CancellationSignal?,
    ): Cursor? {
        if (failQuery) throw IOException("Synthetic query failure after insert")
        return real.query(uri, projection, queryArgs, cancellationSignal)
    }

    override fun query(
        uri: Uri,
        projection: Array<out String>?,
        selection: String?,
        selectionArgs: Array<out String>?,
        sortOrder: String?,
    ): Cursor? = real.query(uri, projection, selection, selectionArgs, sortOrder)

    override fun delete(uri: Uri, extras: Bundle?): Int =
        if (ignoreDelete) 0 else real.delete(uri, extras)

    override fun delete(uri: Uri, selection: String?, selectionArgs: Array<out String>?): Int =
        real.delete(uri, selection, selectionArgs)

    override fun update(
        uri: Uri,
        values: ContentValues?,
        selection: String?,
        selectionArgs: Array<out String>?,
    ): Int = real.update(uri, values, selection, selectionArgs)
}
