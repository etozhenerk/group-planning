package dev.groupplanning.android.data.media

import android.util.AtomicFile
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.session.SessionCipher
import java.io.File
import java.io.IOException
import java.security.GeneralSecurityException
import kotlinx.serialization.SerializationException
import kotlinx.serialization.encodeToString

internal class MediaStorage(private val root: File, private val cipher: SessionCipher) {
    fun records(owner: String, meeting: String): List<SelectedMedia> = protect {
        root.listFiles().orEmpty().filter { it.extension == "json" }.map {
            apiJson.decodeFromString<SelectedMedia>(read(it).decodeToString())
        }.filter { it.owner == owner && it.meeting == meeting }
    }

    fun save(item: SelectedMedia, bytes: ByteArray? = null) = protect {
        root.mkdirs()
        bytes?.let { write(File(root, item.key + ".bytes"), it) }
        write(File(root, item.key + ".json"), apiJson.encodeToString(item).toByteArray())
    }

    fun bytes(item: SelectedMedia): ByteArray = protect { read(File(root, item.key + ".bytes")) }

    fun remove(item: SelectedMedia) = protect {
        AtomicFile(File(root, item.key + ".json")).delete()
        AtomicFile(File(root, item.key + ".bytes")).delete()
    }

    fun clear(meeting: java.util.UUID? = null) = protect {
        if (meeting != null) {
            root.listFiles().orEmpty().filter { it.extension == "json" }.forEach { file ->
                val item = apiJson.decodeFromString<SelectedMedia>(read(file).decodeToString())
                if (item.meeting == meeting.toString()) remove(item)
            }
            return@protect
        }
        if (root.exists() && !root.deleteRecursively()) throw IOException("Media removal")
    }

    private fun read(file: File): ByteArray = cipher.decrypt(AtomicFile(file).readFully())

    private fun write(file: File, bytes: ByteArray) {
        val target = AtomicFile(file)
        val stream = target.startWrite()
        try {
            stream.write(cipher.encrypt(bytes))
            target.finishWrite(stream)
        } catch (error: Exception) {
            target.failWrite(stream)
            throw error
        }
    }

    private fun <T> protect(block: () -> T): T = try {
        block()
    } catch (_: IOException) {
        throw ClientFailure(FailureKind.Storage)
    } catch (_: GeneralSecurityException) {
        throw ClientFailure(FailureKind.Storage)
    } catch (_: SerializationException) {
        throw ClientFailure(FailureKind.Storage)
    }
}
