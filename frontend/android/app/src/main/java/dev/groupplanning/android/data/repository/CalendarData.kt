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
    val cachedPages: Map<CalendarFilter, CalendarPage> = emptyMap(),
    val counts: CalendarCounts? = null,
    val days: List<CalendarDay> = emptyList(),
    val request: UUID? = null,
    val more: UUID? = null,
    val error: ClientFailure? = null,
    val moreError: ClientFailure? = null,
    val pages: Int = 1,
    val failures: Int = 0,
) {
    fun pageFor(value: CalendarFilter): CalendarPage? {
        if (filter == value && page != null) return page
        cachedPages[value]?.let { return it }
        val month = cachedPages.entries.lastOrNull { (key, content) ->
            key.period == value.period &&
                key.from != null &&
                key.to != null &&
                value.from != null &&
                value.to != null &&
                key.from <= value.from &&
                key.to >= value.to &&
                content.nextCursor == null
        }?.value ?: return null
        return month.copy(
            meetings = month.meetings.filter {
                val date = it.localDate?.let(java.time.LocalDate::parse)
                date != null && date >= value.from && date <= value.to
            },
        )
    }

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
