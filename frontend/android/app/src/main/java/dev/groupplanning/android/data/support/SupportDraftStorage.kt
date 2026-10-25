package dev.groupplanning.android.data.support

import android.util.AtomicFile
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.FailureKind
import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.session.SessionCipher
import java.io.File
import java.io.IOException
import java.security.GeneralSecurityException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.SerializationException
import kotlinx.serialization.encodeToString

@Serializable
internal data class SupportDraft(
    val key: String,
    val pending: String? = null,
    val screenshot: SavedScreenshot? = null,
)

@Serializable
internal data class SavedScreenshot(val name: String, val type: String, val data: String)

internal class SupportDraftStorage(file: File, private val cipher: SessionCipher) {
    private val atomic = AtomicFile(file)
    private val mutex = Mutex()

    suspend fun load(): SupportDraft? = protect {
        if (!atomic.baseFile.exists()) {
            null
        } else {
            apiJson.decodeFromString<SupportDraft>(
                cipher.decrypt(atomic.readFully()).decodeToString(),
            )
        }
    }

    suspend fun save(draft: SupportDraft?) = protect {
        if (draft == null) {
            atomic.delete()
        } else {
            val bytes = cipher.encrypt(apiJson.encodeToString(draft).toByteArray())
            val stream = atomic.startWrite()
            try {
                stream.write(bytes)
                atomic.finishWrite(stream)
            } catch (error: Exception) {
                atomic.failWrite(stream)
                throw error
            }
        }
    }

    private suspend fun <T> protect(block: () -> T): T = mutex.withLock {
        withContext(Dispatchers.IO) {
            try {
                block()
            } catch (_: IOException) {
                throw ClientFailure(FailureKind.Storage)
            } catch (_: GeneralSecurityException) {
                throw ClientFailure(FailureKind.Storage)
            } catch (_: SerializationException) {
                throw ClientFailure(FailureKind.Storage)
            }
        }
    }
}
