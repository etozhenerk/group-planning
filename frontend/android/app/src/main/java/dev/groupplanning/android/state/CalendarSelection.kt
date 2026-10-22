package dev.groupplanning.android.state

import dev.groupplanning.android.data.api.models.MeetingPeriod
import dev.groupplanning.android.data.api.requests.CalendarFilter
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.YearMonth
import java.time.temporal.TemporalAdjusters

internal data class CalendarSelection(
    val calendar: Boolean = false,
    val period: MeetingPeriod = MeetingPeriod.Upcoming,
    val undated: Boolean = false,
    val upcomingDay: LocalDate? = null,
    val pastDay: LocalDate? = null,
) {
    val selectedDay: LocalDate? get() = if (period == MeetingPeriod.Past) pastDay else upcomingDay
    val day: LocalDate get() = selectedDay ?: LocalDate.now()
    val creationDay: LocalDate? get() = day.takeIf { calendar && !undated }
    val filter: CalendarFilter get() = when {
        undated -> CalendarFilter(MeetingPeriod.Undated)
        calendar -> CalendarFilter(period, day, day.plusDays(1))
        else -> CalendarFilter(period)
    }
    val monthFilter: CalendarFilter? get() = if (calendar) {
        val first = grid.first()
        CalendarFilter(period, first, first.plusDays(42))
    } else {
        null
    }
    val grid: List<LocalDate> get() {
        val first = day.withDayOfMonth(1)
            .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
        return List(42) { first.plusDays(it.toLong()) }
    }

    fun select(date: LocalDate): CalendarSelection = if (period == MeetingPeriod.Past) {
        copy(pastDay = date, undated = false)
    } else {
        copy(upcomingDay = date, undated = false)
    }

    fun shiftMonth(delta: Long): CalendarSelection {
        val month = YearMonth.from(day).plusMonths(delta)
        return select(month.atDay(day.dayOfMonth.coerceAtMost(month.lengthOfMonth())))
    }

    fun saved(): ArrayList<String> = arrayListOf(
        calendar.toString(),
        period.name,
        undated.toString(),
        upcomingDay?.toString().orEmpty(),
        pastDay?.toString().orEmpty(),
    )

    companion object {
        fun restore(values: List<String>?): CalendarSelection = runCatching {
            requireNotNull(values)
            CalendarSelection(
                values[0].toBooleanStrict(),
                MeetingPeriod.valueOf(values[1]).also { require(it != MeetingPeriod.Undated) },
                values[2].toBooleanStrict(),
                values[3].takeIf(String::isNotEmpty)?.let(LocalDate::parse),
                values[4].takeIf(String::isNotEmpty)?.let(LocalDate::parse),
            )
        }.getOrDefault(CalendarSelection())
    }
}
