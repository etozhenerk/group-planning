package dev.groupplanning.android.album

import dev.groupplanning.android.data.album.AlbumTemporaryFiles
import java.io.File
import java.nio.file.Files
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class AlbumTemporaryFilesTests {
    @get:Rule val files = TemporaryFolder()

    @Test fun recoveryRemovesOnlyOwnedPrivateDirectoriesWithoutFollowingSymlinks() {
        val root = files.newFolder()
        val temporary = AlbumTemporaryFiles(root)
        val stale = temporary.create()
        File(stale, "partial.jpg").writeBytes(ByteArray(1024))
        val unrelated = File(root, "other-feature").apply { mkdir() }
        val retained = File(unrelated, "keep.jpg").apply { writeText("keep") }
        val external = files.newFolder()
        val externalPhoto = File(external, "keep.jpg").apply { writeText("outside") }
        val rootLink = Files.createSymbolicLink(File(root, "album-123").toPath(), external.toPath())
        Files.createSymbolicLink(File(stale, "nested-link").toPath(), external.toPath())
        temporary.removeAbandoned()
        assertFalse(stale.exists())
        assertTrue(retained.exists())
        assertTrue(externalPhoto.exists())
        assertTrue(Files.isSymbolicLink(rootLink))
    }
}
