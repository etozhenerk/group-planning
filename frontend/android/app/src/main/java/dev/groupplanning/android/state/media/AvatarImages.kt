package dev.groupplanning.android.state.media

import android.graphics.Bitmap
import dev.groupplanning.android.data.repository.AvatarRepository
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

internal class AvatarImages(private val repository: AvatarRepository = AvatarRepository()) {
    private val decoded = DecodedImages(4 * 1024 * 1024)
    private val lock = Mutex()

    fun cached(url: String): Bitmap? = decoded.get(url)

    suspend fun load(url: String): Bitmap = lock.withLock {
        cached(url) ?: decodeImage(repository.bytes(url)).also { decoded.put(url, it) }
    }

    fun clear() {
        decoded.clear()
    }
}
