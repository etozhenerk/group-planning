package dev.groupplanning.android

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color
import android.net.Uri
import androidx.exifinterface.media.ExifInterface
import dev.groupplanning.android.data.album.AlbumMediaStoreRows
import dev.groupplanning.android.data.album.AlbumPendingRecord
import dev.groupplanning.android.data.album.AlbumPhoto
import java.io.File
import java.util.UUID
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

@Serializable
internal data class AlbumRecoverySeed(
    val mode: String,
    val operationId: String,
    val own: List<String>,
    val previous: String,
    val unrelated: String,
    val fileName: String,
)

internal class AlbumRecoveryFixture(val context: Context) {
    val root = File(context.noBackupFilesDir, "qa-album-recovery")
    val journal = File(root, "journal")
    val ready = File(root, "ready")
    val ledger = File(root, "seed.json")
    val resolver = context.contentResolver
    val rows = AlbumMediaStoreRows(resolver, context.packageName)
    private val json = Json { encodeDefaults = true }

    init {
        check(context.packageName == "dev.groupplanning.android.uitesthost")
        check(root.mkdirs() || root.isDirectory)
    }

    fun photoFile(): File {
        val file = File.createTempFile("recovery-", ".jpg", root)
        val bitmap = Bitmap.createBitmap(48, 24, Bitmap.Config.ARGB_8888)
        try {
            bitmap.eraseColor(Color.MAGENTA)
            file.outputStream().use { check(bitmap.compress(Bitmap.CompressFormat.JPEG, 95, it)) }
            ExifInterface(file).apply {
                setAttribute(ExifInterface.TAG_ORIENTATION, "6")
                saveAttributes()
            }
        } finally {
            bitmap.recycle()
        }
        return file
    }

    fun insert(record: AlbumPendingRecord, file: File): Uri {
        val photo = AlbumPhoto(UUID.randomUUID(), "image/jpeg", file.length())
        val uri = rows.insert(record, photo)
        resolver.openOutputStream(uri, "w").use { output ->
            checkNotNull(output)
            file.inputStream().use { it.copyTo(output) }
        }
        return uri
    }

    fun save(seed: AlbumRecoverySeed) {
        ledger.outputStream().use {
            it.write(json.encodeToString(seed).toByteArray(Charsets.UTF_8))
            it.fd.sync()
        }
    }

    fun load(): AlbumRecoverySeed = json.decodeFromString(ledger.readText())

    fun exists(uri: String): Boolean = resolver.query(
        Uri.parse(uri),
        arrayOf("_id"),
        null,
        null,
        null,
    ).use { it?.moveToFirst() == true }

    fun bytes(uri: String): ByteArray = resolver.openInputStream(Uri.parse(uri)).use {
        checkNotNull(it).readBytes()
    }

    fun delete(uri: Uri) {
        if (exists(uri.toString())) resolver.delete(uri, null, null)
    }

    fun cleanup(seed: AlbumRecoverySeed) {
        (seed.own + listOf(seed.previous, seed.unrelated)).forEach {
            if (it.isNotEmpty()) delete(Uri.parse(it))
        }
        check(seed.fileName == File(seed.fileName).name)
        File(root, seed.fileName).delete()
        ready.delete()
        ledger.delete()
    }
}
