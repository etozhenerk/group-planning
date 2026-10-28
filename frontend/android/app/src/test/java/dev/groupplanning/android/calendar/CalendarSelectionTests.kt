package dev.groupplanning.android.calendar

import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.CalendarPage
import dev.groupplanning.android.data.api.models.MeetingPeriod
import dev.groupplanning.android.data.repository.CalendarData
import dev.groupplanning.android.state.CalendarSelection
import dev.groupplanning.android.support.Fixtures
import java.time.LocalDate
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class CalendarSelectionTests {
    @Test fun localDateComesFromMeetingZoneAndMalformedZoneIsRejected() {
        val json = Fixtures.json("calendar-upcoming")
            .replace("2026-10-24T16:00:00Z", "2026-10-23T23:00:00Z")
        val page = apiJson.decodeFromString<CalendarPage>(json)
        assertEquals("2026-10-24", page.meetings.single().localDate)
        org.junit.Assert.assertThrows(IllegalArgumentException::class.java) {
            apiJson.decodeFromString<CalendarPage>(json.replace("Europe/Moscow", "invalid-zone"))
        }
    }

    @Test fun monthGridClampsAndPreservesPerPeriodSelection() {
        val date = LocalDate.parse("2026-01-31")
        val selection = CalendarSelection(calendar = true).select(date)
        assertEquals(LocalDate.parse("2026-02-28"), selection.shiftMonth(1).day)
        assertEquals(35, selection.grid.size)
        assertEquals(java.time.DayOfWeek.MONDAY, selection.grid.first().dayOfWeek)
        val history = selection.copy(period = MeetingPeriod.Past)
            .select(LocalDate.parse("2025-12-12"))
        assertEquals(date, history.copy(period = MeetingPeriod.Upcoming).day)
        assertEquals(history, CalendarSelection.restore(history.saved()))
        assertNull(selection.copy(calendar = false).creationDay)
        assertNull(selection.copy(undated = true).creationDay)
    }

    @Test fun gridContainsOnlyCompleteWeeksCoveringMonthAndQueriesSameRange() {
        for ((month, first, last) in listOf(
            Triple("2021-02-15", "2021-02-01", "2021-02-28"),
            Triple("2026-10-31", "2026-09-28", "2026-11-01"),
            Triple("2027-05-20", "2027-04-26", "2027-06-06"),
        )) {
            val selection = CalendarSelection(calendar = true).select(LocalDate.parse(month))
            val start = LocalDate.parse(first)
            val end = LocalDate.parse(last)
            val count = java.time.temporal.ChronoUnit.DAYS.between(start, end).toInt() + 1
            assertEquals(count, selection.grid.size)
            assertEquals(start, selection.grid.first())
            assertEquals(end, selection.grid.last())
            selection.grid.forEachIndexed { index, day ->
                assertEquals(start.plusDays(index.toLong()), day)
            }
            assertEquals(start, selection.monthFilter?.from)
            assertEquals(end.plusDays(1), selection.monthFilter?.to)
        }
    }

    @Test fun todayLeavesUndatedAndPreservesPeriod() {
        val state = CalendarSelection(calendar = true, period = MeetingPeriod.Past, undated = true)
        val today = LocalDate.parse("2026-10-22")
        val result = state.select(today)
        assertEquals(MeetingPeriod.Past, result.period)
        assertEquals(today, result.creationDay)
        assertEquals(today.toString(), result.filter.request().query["from"])
        assertEquals("2026-10-23", result.filter.request().query["to"])
    }

    @Test fun refreshUsesServerBoundaryWithoutChangingPeriodOrBusyLoop() {
        val page = apiJson.decodeFromString<CalendarPage>(Fixtures.json("calendar-upcoming"))
        val boundary = checkNotNull(page.nextTransitionAt).instant
        val state = CalendarData(page = page)
        assertEquals(1000L, state.refreshDelay(boundary.minusSeconds(1)))
        assertEquals(5000L, state.refreshDelay(boundary))
        assertEquals(60_000L, state.copy(failures = 10).refreshDelay(boundary))
        assertEquals(MeetingPeriod.Upcoming, page.meetings.single().period)
        assertTrue(state.refreshDelay(boundary.minusMillis(1)) >= 250)
    }
}
