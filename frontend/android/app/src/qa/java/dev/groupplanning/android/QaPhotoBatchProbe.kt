package dev.groupplanning.android

import java.io.IOException
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.atomic.AtomicReference
import okhttp3.Request

/** Observe real fixture commits, then lose only the later publish reply. Never in production. */
internal object QaPhotoBatchProbe {
    private enum class Mode { Inactive, FailLater, Pass }

    @Volatile private var mode = Mode.Inactive
    private val first = AtomicReference<String?>(null)
    private val counts = ConcurrentHashMap<String, AtomicInteger>()

    @Volatile private var failureGate = CountDownLatch(1)

    @Volatile var failureEntered = false
        private set

    val publishCounts: Map<String, Int> get() = counts.mapValues { it.value.get() }

    fun arm() {
        reset()
        failureGate = CountDownLatch(1)
        mode = Mode.FailLater
    }

    fun releaseFailure() = failureGate.countDown()

    fun allowRetry() {
        mode = Mode.Pass
        failureGate.countDown()
    }

    fun reset() {
        mode = Mode.Inactive
        failureGate.countDown()
        first.set(null)
        counts.clear()
        failureEntered = false
    }

    fun after(request: Request) {
        if (mode == Mode.Inactive ||
            request.url.host != "127.0.0.1" ||
            request.method != "POST" ||
            !request.url.encodedPath.endsWith("/publish")
        ) {
            return
        }
        val path = request.url.encodedPath
        counts.computeIfAbsent(path) { AtomicInteger() }.incrementAndGet()
        first.compareAndSet(null, path)
        if (mode != Mode.FailLater || path == first.get()) return
        failureEntered = true
        if (!failureGate.await(45, TimeUnit.SECONDS)) {
            throw IOException("QA photo reply gate timed out")
        }
        if (mode != Mode.Inactive) throw IOException("Controlled QA lost photo publish reply")
    }
}
