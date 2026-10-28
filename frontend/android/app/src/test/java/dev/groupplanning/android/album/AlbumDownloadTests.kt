package dev.groupplanning.android.album

import dev.groupplanning.android.data.album.AlbumSaveFailure
import dev.groupplanning.android.data.album.AlbumSaveIssue
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import dev.groupplanning.android.data.repository.AlbumDownloadRepository
import java.io.IOException
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.cancelAndJoin
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class AlbumDownloadTests {
    @get:Rule val files = TemporaryFolder()

    @Test fun snapshotBeyondOnePageIsDownloadedOnceBeforeAnyGalleryWrite() = runTest {
        val h = AlbumHarness(files.newFolder(), StandardTestDispatcher(testScheduler))
        h.session.login()
        val photos = h.photos(103)
        h.snapshot(photos)
        h.contents(photos)
        h.verify()
        h.gallery.onStage = { file ->
            assertEquals(103, checkNotNull(file.parentFile?.listFiles()).size)
            assertEquals(
                103,
                h.session.transport.requests.count {
                    it.url.pathSegments.last() == "content"
                },
            )
            assertTrue(file.name.matches(Regex("[a-f0-9-]+\\.jpg")))
        }
        assertEquals(103, h.repository.save(h.access()))
        assertEquals(103, h.gallery.originals.size)
        h.gallery.originals.values.forEach { assertArrayEquals(h.bytes, it) }
        assertTrue(h.gallery.published)
        assertFalse(h.gallery.discarded)
        assertEquals(0, checkNotNull(h.folder.list()).size)
        assertEquals(
            1,
            h.session.transport.requests.count {
                it.url.pathSegments.last() == "snapshot"
            },
        )
    }

    @Test fun deniedPermissionAndIncompleteSnapshotNeverCreateGalleryRecords() = runTest {
        val h = AlbumHarness(files.newFolder(), StandardTestDispatcher(testScheduler))
        h.session.login()
        h.gallery.permitted = false
        assertIssue(AlbumSaveIssue.PermissionRequired) { h.repository.save(h.access()) }
        assertEquals(1, h.session.transport.requests.size)
        h.gallery.permitted = true
        h.snapshot(h.photos(2), next = "unexpected-page")
        assertIssue(AlbumSaveIssue.InvalidSnapshot) { h.repository.save(h.access()) }
        assertFalse(h.gallery.began)
        assertEquals(0, checkNotNull(h.folder.list()).size)
    }

    @Test fun networkFailureAfterFirstPhotoRemovesPrivateFilesWithoutTouchingGallery() = runTest {
        val h = AlbumHarness(files.newFolder(), StandardTestDispatcher(testScheduler))
        h.session.login()
        val photos = h.photos(2)
        h.snapshot(photos)
        h.contents(photos.take(1))
        h.session.transport.handle("${h.path}/media/${photos.last().id}/content") {
            throw ClientFailure(FailureKind.Network)
        }
        try {
            h.repository.save(h.access())
            error("Expected network failure")
        } catch (failure: ClientFailure) {
            assertEquals(FailureKind.Network, failure.kind)
        }
        assertFalse(h.gallery.began)
        assertEquals(0, checkNotNull(h.folder.list()).size)
    }

    @Test fun cancelledOwnerRollsBackPendingFilesAndAllowsFreshAttempt() = runTest {
        val h = AlbumHarness(files.newFolder(), StandardTestDispatcher(testScheduler))
        h.session.login()
        val photos = h.photos(2)
        h.snapshot(photos)
        h.contents(photos)
        val staged = CompletableDeferred<Unit>()
        h.gallery.onStage = {
            staged.complete(Unit)
            awaitCancellation()
        }
        val job = async { h.repository.save(h.access()) }
        staged.await()
        assertIssue(AlbumSaveIssue.Busy) { h.repository.save(h.access()) }
        val recreated = AlbumDownloadRepository(
            h.session.session,
            h.gallery,
            h.folder,
            StandardTestDispatcher(testScheduler),
        )
        assertIssue(AlbumSaveIssue.Busy) { recreated.save(h.access()) }
        assertEquals(1, checkNotNull(h.folder.list()).size)
        job.cancelAndJoin()
        assertTrue(h.gallery.discarded)
        assertFalse(h.gallery.published)
        assertTrue(h.gallery.originals.isEmpty())
        assertEquals(0, checkNotNull(h.folder.list()).size)
        h.gallery.onStage = {}
        h.snapshot(photos)
        h.contents(photos)
        h.verify()
        assertEquals(2, h.repository.save(h.access()))
    }

    @Test fun accessRevocationCancelsPreparationEvenWhileNoRequestIsRunning() = runTest {
        val h = AlbumHarness(files.newFolder(), StandardTestDispatcher(testScheduler))
        h.session.login()
        val photos = h.photos(1)
        h.snapshot(photos)
        h.contents(photos)
        val staged = CompletableDeferred<Unit>()
        h.gallery.onStage = {
            staged.complete(Unit)
            awaitCancellation()
        }
        val job = async { h.repository.save(h.access()) }
        staged.await()
        h.session.session.updateAccess(h.id, allowed = false)
        job.join()
        assertTrue(job.isCancelled)
        assertTrue(h.gallery.discarded)
        assertTrue(h.gallery.originals.isEmpty())
        assertEquals(0, checkNotNull(h.folder.list()).size)
    }

    @Test fun finalPublicationFailureRollsBackEveryCreatedEntry() = runTest {
        val h = AlbumHarness(files.newFolder(), StandardTestDispatcher(testScheduler))
        h.session.login()
        val photos = h.photos(3)
        h.snapshot(photos)
        h.contents(photos)
        h.verify()
        h.gallery.onPublish = { throw IOException("synthetic disk failure") }
        assertIssue(AlbumSaveIssue.Storage) { h.repository.save(h.access()) }
        assertTrue(h.gallery.discarded)
        assertTrue(h.gallery.originals.isEmpty())
        assertEquals(0, checkNotNull(h.folder.list()).size)
    }

    @Test fun logoutCancelsAnInFlightDownloadAndDeletesPrivatePreparation() = runTest {
        val h = AlbumHarness(files.newFolder(), StandardTestDispatcher(testScheduler))
        h.session.login()
        val photos = h.photos(2)
        h.snapshot(photos)
        h.contents(photos.take(1))
        val reading = CompletableDeferred<Unit>()
        h.session.transport.handle("${h.path}/media/${photos.last().id}/content") {
            reading.complete(Unit)
            awaitCancellation()
        }
        val job = async { h.repository.save(h.access()) }
        reading.await()
        h.session.transport.enqueue("auth/logout", status = 204)
        h.session.session.logout()
        job.join()
        assertTrue(job.isCancelled)
        assertFalse(h.gallery.began)
        assertEquals(0, checkNotNull(h.folder.list()).size)
    }

    @Test fun duplicateSnapshotAndTruncatedContentCannotBePublished() = runTest {
        val h = AlbumHarness(files.newFolder(), StandardTestDispatcher(testScheduler))
        h.session.login()
        val photo = h.photos(1).single()
        h.snapshot(listOf(photo, photo))
        assertIssue(AlbumSaveIssue.InvalidSnapshot) { h.repository.save(h.access()) }
        h.snapshot(listOf(photo.copy(sizeBytes = photo.sizeBytes + 1)))
        h.contents(listOf(photo))
        assertIssue(AlbumSaveIssue.InvalidSnapshot) { h.repository.save(h.access()) }
        assertFalse(h.gallery.began)
        assertEquals(0, checkNotNull(h.folder.list()).size)
    }

    @Test fun cancellationAfterFinalSystemHandoffDoesNotDeleteCompletedPersonalCopies() = runTest {
        val h = AlbumHarness(files.newFolder(), StandardTestDispatcher(testScheduler))
        h.session.login()
        val photos = h.photos(2)
        h.snapshot(photos)
        h.contents(photos)
        h.verify()
        val saving = CompletableDeferred<Unit>()
        val finish = CompletableDeferred<Unit>()
        h.gallery.onPublish = {
            saving.complete(Unit)
            finish.await()
        }
        val job = async { h.repository.save(h.access()) }
        saving.await()
        job.cancel()
        finish.complete(Unit)
        job.join()
        assertTrue(h.gallery.published)
        assertFalse(h.gallery.discarded)
        assertEquals(2, h.gallery.originals.size)
        assertEquals(0, checkNotNull(h.folder.list()).size)
    }

    private suspend fun assertIssue(issue: AlbumSaveIssue, block: suspend () -> Unit) {
        try {
            block()
            error("Expected $issue")
        } catch (failure: AlbumSaveFailure) {
            assertEquals(issue, failure.issue)
        }
    }
}
