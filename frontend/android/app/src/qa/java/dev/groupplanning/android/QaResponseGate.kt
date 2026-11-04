package dev.groupplanning.android

import java.io.IOException
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger
import okhttp3.Request

/** Controlled delays/failures belong only to the loopback QA transport. */
internal object QaResponseGate {
    @Volatile var historyEntered = false
        private set

    @Volatile var rejectMessage = false

    @Volatile var unavailableGetPath: String? = null

    @Volatile var unavailableMediaPrefix: String? = null

    private val persistenceMessageAttempts = AtomicInteger(-1)

    fun allowOnePersistenceMessageAttempt() {
        persistenceMessageAttempts.set(1)
    }

    fun releasePersistenceMessageAttempts() {
        persistenceMessageAttempts.set(-1)
    }

    @Volatile private var listErrorHeld = false

    fun observeListFailure(request: Request, status: Int) {
        if (request.method == "GET" &&
            request.url.encodedPath == "/api/v1/meetings" &&
            status >= 500
        ) {
            listErrorHeld = true
        }
    }

    fun releaseListError() {
        listErrorHeld = false
    }

    @Volatile private var history: CountDownLatch? = null

    @Volatile private var media: CountDownLatch? = null

    @Volatile private var mediaPath: String? = null

    @Volatile private var publicationPrefix: String? = null

    @Volatile var mediaEntered = false
        private set

    fun holdMedia(path: String) {
        releaseMedia()
        mediaEntered = false
        mediaPath = path
        media = CountDownLatch(1)
    }

    fun releaseMedia() {
        media?.countDown()
        media = null
        mediaPath = null
        publicationPrefix = null
    }

    fun holdPublication(prefix: String) {
        releaseMedia()
        mediaEntered = false
        publicationPrefix = prefix
        media = CountDownLatch(1)
    }

    fun holdHistory() {
        releaseHistory()
        historyEntered = false
        history = CountDownLatch(1)
    }

    fun releaseHistory() {
        history?.countDown()
        history = null
    }

    fun before(request: Request, scenario: String) {
        if (request.url.host == "127.0.0.1" &&
            request.method == "GET" &&
            request.url.encodedPath.endsWith("/content") &&
            unavailableMediaPrefix?.let { request.url.encodedPath.startsWith(it) } == true
        ) {
            throw IOException("Controlled QA album outage")
        }
        if (request.url.host == "127.0.0.1" &&
            request.method == "GET" &&
            request.url.encodedPath == unavailableGetPath
        ) {
            throw IOException("Controlled QA read outage")
        }
        if (request.url.host == "127.0.0.1" &&
            request.method == "GET" &&
            request.url.encodedPath == "/api/v1/meetings" &&
            listErrorHeld
        ) {
            throw IOException("Controlled QA list outage until explicit retry")
        }
        if (request.url.host == "127.0.0.1" &&
            request.method == "POST" &&
            request.url.encodedPath.endsWith("/messages")
        ) {
            val exhausted = scenario == "feed-persistence" &&
                persistenceMessageAttempts.getAndUpdate { if (it > 0) it - 1 else it } == 0
            if (rejectMessage || exhausted) {
                throw IOException("Controlled QA message outage before commit")
            }
        }
    }

    fun after(request: Request) {
        val matchingMedia = request.method == "GET" && request.url.encodedPath == mediaPath
        val matchingPublication = request.method == "POST" &&
            request.url.encodedPath.endsWith("/publish") &&
            publicationPrefix?.let { request.url.encodedPath.startsWith(it) } == true
        if (request.url.host == "127.0.0.1" &&
            (matchingMedia || matchingPublication)
        ) {
            val gate = media
            if (gate != null) {
                mediaEntered = true
                if (!gate.await(45, TimeUnit.SECONDS)) throw IOException("QA media gate timed out")
            }
        }
        if (request.url.host != "127.0.0.1" ||
            request.method != "GET" ||
            request.url.queryParameter("before_sequence") == null
        ) {
            return
        }
        val gate = history ?: return
        historyEntered = true
        if (!gate.await(45, TimeUnit.SECONDS)) throw IOException("QA history gate timed out")
    }
}
