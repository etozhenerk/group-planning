package dev.groupplanning.android

import java.io.IOException
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import okhttp3.Request

/** Controlled delays/failures belong only to the loopback QA transport. */
internal object QaResponseGate {
    @Volatile var historyEntered = false
        private set

    @Volatile var rejectMessage = false

    @Volatile private var history: CountDownLatch? = null

    fun holdHistory() {
        releaseHistory()
        historyEntered = false
        history = CountDownLatch(1)
    }

    fun releaseHistory() {
        history?.countDown()
        history = null
    }

    fun before(request: Request) {
        if (request.url.host == "127.0.0.1" &&
            request.method == "POST" &&
            request.url.encodedPath.endsWith("/messages") &&
            rejectMessage
        ) {
            throw IOException("Controlled QA message outage before commit")
        }
    }

    fun after(request: Request) {
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
