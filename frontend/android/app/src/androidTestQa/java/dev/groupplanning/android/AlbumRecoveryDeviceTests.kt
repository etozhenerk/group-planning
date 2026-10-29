package dev.groupplanning.android

import android.content.ContentValues
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import androidx.test.filters.SdkSuppress
import androidx.test.platform.app.InstrumentationRegistry
import dev.groupplanning.android.data.album.AlbumMediaStoreRows
import dev.groupplanning.android.data.album.AlbumPendingJournal
import dev.groupplanning.android.data.album.AlbumPendingPhase
import dev.groupplanning.android.data.album.AlbumPendingRecord
import dev.groupplanning.android.data.album.AlbumSaveFailure
import dev.groupplanning.android.data.album.AlbumSaveIssue
import dev.groupplanning.android.data.album.MediaStoreAlbumGallery
import java.io.File
import java.io.IOException
import java.util.UUID
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test

@SdkSuppress(minSdkVersion = 29)
class AlbumRecoveryDeviceTests {
    private val instrumentation = InstrumentationRegistry.getInstrumentation()
    private val fixture = AlbumRecoveryFixture(instrumentation.targetContext)

    @Test fun prepareAndHoldForForceStop() = runBlocking(Dispatchers.IO) {
        val mode = InstrumentationRegistry.getArguments().getString("recoveryMode")
        check(mode in listOf("pending", "partial", "published"))
        check(!fixture.ledger.exists())
        val file = fixture.photoFile()
        val record = newRecord()
        val control = newRecord()
        val previous = fixture.insert(control, file)
        fixture.rows.publish(control, listOf(previous))
        val unrelated = fixture.insert(control, file)
        var seed = AlbumRecoverySeed(
            checkNotNull(mode),
            record.operationId,
            emptyList(),
            previous.toString(),
            unrelated.toString(),
            file.name,
        )
        fixture.save(seed)
        // Keep the real lock until am force-stop kills this instrumentation process.
        AlbumPendingJournal(fixture.journal).acquire().use { lease ->
            lease.write(record)
            val count = if (mode == "partial") 101 else 2
            repeat(count) {
                val inserted = fixture.insert(record, file)
                seed = seed.copy(own = seed.own + inserted.toString())
                fixture.save(seed)
            }
            assertFalse(File(fixture.journal, "active.json").readText().contains("content://"))
            if (mode != "pending") {
                lease.write(record.copy(phase = AlbumPendingPhase.Publishing))
                val batch = if (mode == "partial") seed.own.take(100) else seed.own
                fixture.rows.publish(record, batch.map(Uri::parse))
            }
            fixture.ready.outputStream().use {
                it.write(mode.toByteArray())
                it.fd.sync()
            }
            instrumentation.sendStatus(
                0,
                Bundle().apply {
                    putString("stream", "RECOVERY_READY\n")
                },
            )
            CountDownLatch(1).await(2, TimeUnit.MINUTES)
            fail("Runner did not force-stop the prepared QA process")
        }
    }

    @Test fun restartBeginRecoversOnlyPendingAndPreservesPublished() = runBlocking(Dispatchers.IO) {
        val seed = fixture.load()
        val file = File(fixture.root, seed.fileName)
        val expectedSaved = when (seed.mode) {
            "pending" -> 0
            "partial" -> 100
            "published" -> 2
            else -> error("Invalid seed")
        }
        try {
            assertTrue(File(fixture.journal, "active.json").exists())
            val gallery = MediaStoreAlbumGallery(fixture.context, fixture.journal)
            val operation = gallery.begin()
            operation.discard()
            for ((index, uri) in seed.own.withIndex()) {
                assertEquals(index < expectedSaved, fixture.exists(uri))
                if (index < expectedSaved) assertArrayEquals(file.readBytes(), fixture.bytes(uri))
            }
            assertTrue(fixture.exists(seed.previous))
            assertTrue(fixture.exists(seed.unrelated))
            assertArrayEquals(file.readBytes(), fixture.bytes(seed.previous))
            gallery.recoverPending()
            gallery.recoverPending()
            assertEquals(expectedSaved, seed.own.count(fixture::exists))
            assertTrue(fixture.exists(seed.previous))
            assertTrue(fixture.exists(seed.unrelated))
            assertFalse(File(fixture.journal, "active.json").exists())
        } finally {
            fixture.cleanup(seed)
        }
    }

    @Test fun activeJournalAndMalformedJournalCannotDeletePendingRows() = runBlocking(
        Dispatchers.IO,
    ) {
        val file = fixture.photoFile()
        val record = newRecord()
        val uri = fixture.insert(record, file)
        val journal = AlbumPendingJournal(fixture.journal)
        val gallery = MediaStoreAlbumGallery(fixture.context, fixture.journal)
        try {
            journal.acquire().use {
                it.write(record)
                val error = assertThrows(AlbumSaveFailure::class.java) { gallery.begin() }
                assertEquals(AlbumSaveIssue.Busy, error.issue)
                assertTrue(fixture.exists(uri.toString()))
            }
            File(fixture.journal, "active.json").writeText("broken")
            assertThrows(IOException::class.java) { gallery.begin() }
            assertTrue(fixture.exists(uri.toString()))
            journal.acquire().use { it.write(record) }
            gallery.recoverPending()
            assertFalse(fixture.exists(uri.toString()))
        } finally {
            fixture.delete(uri)
            journal.acquire().use { it.clear() }
            file.delete()
        }
    }

    @Test fun pendingPredicateOnDeleteProtectsPublishedRows() = runBlocking(Dispatchers.IO) {
        val file = fixture.photoFile()
        val record = newRecord()
        val uri = fixture.insert(record, file)
        try {
            fixture.rows.publish(record, listOf(uri))
            fixture.rows.delete(record, uri, pendingOnly = true)
            assertTrue(fixture.exists(uri.toString()))
            assertArrayEquals(file.readBytes(), fixture.bytes(uri.toString()))
            val other = newRecord()
            fixture.rows.delete(other, uri, pendingOnly = false)
            assertTrue(fixture.exists(uri.toString()))
            AlbumMediaStoreRows(fixture.resolver, "unrelated.package")
                .delete(record, uri, pendingOnly = false)
            assertTrue(fixture.exists(uri.toString()))
            fixture.resolver.update(
                uri,
                ContentValues().apply {
                    put(MediaStore.Images.Media.RELATIVE_PATH, "Pictures/qa-album-control/")
                },
                null,
                null,
            )
            fixture.rows.delete(record, uri, pendingOnly = false)
            assertTrue(fixture.exists(uri.toString()))
            assertEquals(
                0,
                fixture.resolver.query(
                    uri,
                    arrayOf(MediaStore.Images.Media.IS_PENDING),
                    null,
                    null,
                    null,
                ).use {
                    checkNotNull(it)
                    check(it.moveToFirst())
                    it.getInt(0)
                },
            )
        } finally {
            fixture.delete(uri)
            file.delete()
        }
    }

    private fun newRecord() = AlbumPendingRecord(
        1,
        UUID.randomUUID().toString(),
        AlbumPendingPhase.Preparing,
    )
}
