package dev.groupplanning.android.state.feed

import java.time.Duration
import java.time.Instant

internal fun pendingIndicatorDelay(enqueued: Instant, now: Instant, threshold: Long): Long =
    (threshold - Duration.between(enqueued, now).toMillis().coerceAtLeast(0))
        .coerceIn(0, threshold)
