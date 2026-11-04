package dev.groupplanning.android

import java.io.IOException
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import okhttp3.Request

/** Message ACK ordering in the isolated native API, with bounded waits. */
internal object QaAvatarAckGate {
    @Volatile private var mode: String? = null

    @Volatile private var latch: CountDownLatch? = null

    @Volatile private var commit: CountDownLatch? = null

    @Volatile var entered = false
        private set

    @Volatile var replyHeld = false
        private set

    fun hold(value: String) {
        release()
        entered = false
        replyHeld = false
        mode = value
        latch = CountDownLatch(1)
        commit = CountDownLatch(1)
    }

    fun release() {
        mode = null
        commit?.countDown()
        commit = null
        latch?.countDown()
        latch = null
    }

    fun before(request: Request) {
        if (matches(request) && mode != null) {
            entered = true
            check(commit?.await(20, TimeUnit.SECONDS) != false) { "Message commit gate timed out" }
        }
    }

    fun allowCommit() {
        commit?.countDown()
    }

    fun after(request: Request) {
        if (!matches(request)) return
        when (mode) {
            "after" -> awaitRelease()
            "drop" -> {
                entered = true
                release()
                throw IOException("Controlled missing message ACK")
            }
        }
    }

    private fun awaitRelease() {
        replyHeld = true
        entered = true
        check(latch?.await(20, TimeUnit.SECONDS) != false) { "Message ACK gate timed out" }
    }

    private fun matches(request: Request): Boolean = request.url.host == "127.0.0.1" &&
        request.method == "POST" &&
        request.url.encodedPath.endsWith("/messages")
}
