package dev.groupplanning.android

import android.os.Handler
import android.os.HandlerThread
import android.view.FrameMetrics
import android.view.Window
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.atomic.AtomicLong
import org.json.JSONArray
import org.json.JSONObject

/** Fixed buffers avoid growing the QA sampler heap while measuring the application. */
internal class WindowFrameBaseline : AutoCloseable {
    private val thread = HandlerThread("somewhere-qa-frame-baseline").apply { start() }
    private val durations = LongArray(100_000)
    private val vsyncs = LongArray(100_000)
    private val count = AtomicInteger()
    private val dropped = AtomicLong()
    private val listener = Window.OnFrameMetricsAvailableListener { _, metrics, missed ->
        dropped.addAndGet(missed.toLong())
        if (metrics.getMetric(FrameMetrics.FIRST_DRAW_FRAME) == 0L) {
            val index = count.getAndIncrement()
            if (index < durations.size) {
                durations[index] = metrics.getMetric(FrameMetrics.TOTAL_DURATION)
                vsyncs[index] = metrics.getMetric(FrameMetrics.INTENDED_VSYNC_TIMESTAMP)
            }
        }
    }

    fun start(window: Window) {
        window.addOnFrameMetricsAvailableListener(listener, Handler(thread.looper))
    }

    fun stop(window: Window) {
        window.removeOnFrameMetricsAvailableListener(listener)
    }

    fun result(): JSONObject {
        val size = count.get().coerceAtMost(durations.size)
        val ordered = durations.take(size).sorted()
        fun percentile(fraction: Double): Double =
            ordered[(kotlin.math.ceil(size * fraction).toInt() - 1).coerceAtLeast(0)] / 1_000_000.0
        check(size > 0) { "The application window produced no frame samples" }
        return JSONObject().apply {
            put(
                "scope",
                "FrameMetrics TOTAL_DURATION, first draws excluded; not GPU presentation latency",
            )
            put("sampleCount", size)
            put("bufferOverflow", count.get() > durations.size)
            put("droppedCallbacks", dropped.get())
            put("p95Ms", percentile(0.95))
            put("p99Ms", percentile(0.99))
            put("durationNs", JSONArray(durations.take(size)))
            put("intendedVsyncNs", JSONArray(vsyncs.take(size)))
        }
    }

    override fun close() {
        thread.quitSafely()
        thread.join(5_000)
        check(!thread.isAlive) { "Frame sampler did not stop" }
    }
}
