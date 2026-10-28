package dev.groupplanning.android.data.album

import java.io.File
import java.io.IOException
import java.nio.file.FileVisitResult
import java.nio.file.Files
import java.nio.file.LinkOption
import java.nio.file.Path
import java.nio.file.SimpleFileVisitor
import java.nio.file.attribute.BasicFileAttributes
import java.util.UUID

internal class AlbumTemporaryFiles(private val root: File) {
    fun removeAbandoned() {
        Files.createDirectories(root.toPath())
        Files.newDirectoryStream(root.toPath()).use { entries ->
            entries.forEach { path ->
                if (path.fileName.toString().matches(Regex("album-[a-f0-9-]+")) &&
                    Files.isDirectory(path, LinkOption.NOFOLLOW_LINKS)
                ) {
                    remove(path.toFile())
                }
            }
        }
    }

    fun create(): File = Files.createDirectory(
        File(root, "album-${UUID.randomUUID()}").toPath(),
    ).toFile()

    fun remove(folder: File) {
        require(folder.parentFile == root)
        Files.walkFileTree(
            folder.toPath(),
            object : SimpleFileVisitor<Path>() {
                override fun visitFile(file: Path, attrs: BasicFileAttributes): FileVisitResult {
                    Files.delete(file)
                    return FileVisitResult.CONTINUE
                }

                override fun postVisitDirectory(dir: Path, exc: IOException?): FileVisitResult {
                    if (exc != null) throw exc
                    Files.delete(dir)
                    return FileVisitResult.CONTINUE
                }
            },
        )
    }
}
