package dev.groupplanning.android.album

import dev.groupplanning.android.data.album.AlbumPendingJournal
import dev.groupplanning.android.data.album.AlbumPendingPhase
import dev.groupplanning.android.data.album.AlbumPendingRecord
import dev.groupplanning.android.data.album.AlbumSaveFailure
import dev.groupplanning.android.data.album.AlbumSaveIssue
import java.io.File
import java.io.IOException
import java.nio.file.Files
import java.util.UUID
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class AlbumPendingJournalTests {
    @get:Rule val temporary = TemporaryFolder()

    @Test fun durableIntentSurvivesReopenAndIncompleteReplacement() {
        val folder = temporary.newFolder()
        val expected = record()
        AlbumPendingJournal(folder).acquire().use { it.write(expected) }
        File(folder, "active.new").writeText("incomplete")
        AlbumPendingJournal(folder).acquire().use {
            assertEquals(expected, it.read())
            val publishing = expected.copy(phase = AlbumPendingPhase.Publishing)
            it.write(publishing)
            assertEquals(publishing, it.read())
        }
        AlbumPendingJournal(folder).acquire().use {
            assertEquals(AlbumPendingPhase.Publishing, it.read()?.phase)
            it.clear()
            assertEquals(null, it.read())
        }
        assertFalse(File(folder, "active.new").exists())
    }

    @Test fun onlyOneOperationCanOwnJournalAndClosingReleasesLock() {
        val folder = temporary.newFolder()
        val journal = AlbumPendingJournal(folder)
        journal.acquire().use {
            it.write(record())
            val failure = assertThrows(AlbumSaveFailure::class.java) {
                AlbumPendingJournal(folder).acquire()
            }
            assertEquals(AlbumSaveIssue.Busy, failure.issue)
        }
        AlbumPendingJournal(folder).acquire().use { assertTrue(it.read() != null) }
    }

    @Test fun malformedOversizedAndNonCanonicalRecordsFailClosed() {
        val folder = temporary.newFolder()
        val id = UUID.randomUUID().toString()
        val documents = listOf(
            "broken",
            "x".repeat(4097),
            """{"version":2,"operationId":"$id","phase":"Preparing"}""",
            """{"version":1,"operationId":"1-1-1-1-1","phase":"Preparing"}""",
            """{"version":1,"operationId":"$id","phase":"Unknown"}""",
            """{"version":1,"operationId":"$id","phase":"Preparing","unexpected":1}""",
        )
        for (document in documents) {
            File(folder, "active.json").writeText(document)
            AlbumPendingJournal(folder).acquire().use {
                assertThrows(IOException::class.java) { it.read() }
            }
            assertEquals(document, File(folder, "active.json").readText())
        }
    }

    @Test fun symbolicLinksCannotRedirectJournalReadOrWrite() {
        val folder = temporary.newFolder()
        val other = temporary.newFile().apply { writeText("preserve") }
        Files.createSymbolicLink(File(folder, "active.json").toPath(), other.toPath())
        AlbumPendingJournal(folder).acquire().use {
            assertThrows(IOException::class.java) { it.read() }
            assertThrows(IOException::class.java) { it.write(record()) }
        }
        assertEquals("preserve", other.readText())
        Files.delete(File(folder, "active.json").toPath())
        Files.createSymbolicLink(File(folder, "active.new").toPath(), other.toPath())
        AlbumPendingJournal(folder).acquire().use {
            assertThrows(IOException::class.java) { it.write(record()) }
        }
        assertEquals("preserve", other.readText())
    }

    private fun record() = AlbumPendingRecord(
        1,
        UUID.randomUUID().toString(),
        AlbumPendingPhase.Preparing,
    )
}
