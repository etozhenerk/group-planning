package dev.groupplanning.android

import java.io.IOException
import java.security.MessageDigest
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import okhttp3.Request
import okhttp3.Response
import org.json.JSONObject

/** Album transport controls and original-byte evidence exist only in the QA source set. */
internal object QaAlbumDownloadProbe {
    @Volatile var rejectSnapshot = false

    @Volatile var snapshotEntered = false
        private set

    @Volatile var photoIds = emptySet<String>()
        private set
    val contentHashes = ConcurrentHashMap<String, String>()

    @Volatile private var snapshotGate: CountDownLatch? = null

    fun reset() {
        release()
        rejectSnapshot = false
        snapshotEntered = false
        photoIds = emptySet()
        contentHashes.clear()
    }

    fun holdSnapshot() {
        release()
        snapshotEntered = false
        snapshotGate = CountDownLatch(1)
    }

    fun release() {
        snapshotGate?.countDown()
        snapshotGate = null
    }

    fun before(request: Request) {
        if (request.url.host == "127.0.0.1" &&
            request.url.encodedPath.endsWith("/memories/snapshot") &&
            rejectSnapshot
        ) {
            throw IOException("Controlled QA album preparation failure")
        }
    }

    fun after(response: Response) {
        val request = response.request
        if (request.url.host != "127.0.0.1" ||
            request.method != "GET" ||
            !response.isSuccessful
        ) {
            return
        }
        if (request.url.encodedPath.endsWith("/memories/snapshot")) {
            val photos = JSONObject(response.peekBody(1024 * 1024).string()).getJSONArray("photos")
            photoIds =
                (0 until photos.length()).map { photos.getJSONObject(it).getString("id") }.toSet()
            snapshotEntered = true
            val gate = snapshotGate
            if (gate != null && !gate.await(45, TimeUnit.SECONDS)) {
                throw IOException("QA album gate timed out")
            }
        } else if (request.url.encodedPath.endsWith("/content")) {
            val id = request.url.pathSegments.dropLast(1).lastOrNull() ?: return
            if (id in photoIds) {
                contentHashes[id] = MessageDigest.getInstance("SHA-256")
                    .digest(response.peekBody(10L * 1024 * 1024).bytes())
                    .joinToString("") { "%02x".format(it) }
            }
        }
    }
}
