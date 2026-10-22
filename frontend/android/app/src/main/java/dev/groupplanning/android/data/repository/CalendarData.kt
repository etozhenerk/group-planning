package dev.groupplanning.android.data.repository

import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.models.CalendarCounts
import dev.groupplanning.android.data.api.models.CalendarDay
import dev.groupplanning.android.data.api.models.CalendarPage
import dev.groupplanning.android.data.api.requests.CalendarFilter
import java.time.Duration
import java.time.Instant
import java.util.UUID

internal data class CalendarData(
    val filter: CalendarFilter? = null,
    val monthFilter: CalendarFilter? = null,
    val page: CalendarPage? = null,
    val counts: CalendarCounts? = null,
    val days: List<CalendarDay> = emptyList(),
    val request: UUID? = null,
    val more: UUID? = null,
    val error: ClientFailure? = null,
    val moreError: ClientFailure? = null,
    val pages: Int = 1,
    val failures: Int = 0,
) {
    fun refreshDelay(now: Instant): Long {
        val normal = (page?.refreshAfterSeconds ?: 5).toLong() * 1000
        if (failures > 0) return (normal * (1L shl failures.coerceAtMost(4))).coerceAtMost(60_000)
        val remaining = page?.nextTransitionAt?.instant?.let {
            Duration.between(now, it).toMillis()
        }
        return if (remaining != null && remaining > 0) {
            minOf(normal, remaining).coerceAtLeast(250)
        } else {
            normal
        }
    }
}
