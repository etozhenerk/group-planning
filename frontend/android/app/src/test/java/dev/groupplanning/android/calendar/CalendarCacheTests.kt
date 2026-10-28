package dev.groupplanning.android.calendar

import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.CalendarPage
import dev.groupplanning.android.data.api.models.MeetingPeriod
import dev.groupplanning.android.data.api.requests.CalendarFilter
import dev.groupplanning.android.data.repository.CalendarData
import dev.groupplanning.android.data.repository.PrivateData
import dev.groupplanning.android.support.Fixtures
import java.time.LocalDate
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class CalendarCacheTests {
    private val sample = apiJson.decodeFromString<CalendarPage>(Fixtures.json("calendar-upcoming"))
    private val day = LocalDate.parse(sample.meetings.single().localDate)
    private val month = CalendarFilter(
        MeetingPeriod.Upcoming,
        day.withDayOfMonth(1),
        day.withDayOfMonth(day.lengthOfMonth()),
    )
    private val filter = CalendarFilter(MeetingPeriod.Upcoming, day, day)

    @Test fun completeMonthSuppliesDayWithoutLoadingFlashOrAnotherDaysMeetings() {
        val data = CalendarData(cachedPages = mapOf(month to sample.copy(nextCursor = null)))
        assertEquals(sample.meetings, data.pageFor(filter)?.meetings)
        val emptyDay = if (day.dayOfMonth == 1) day.plusDays(1) else day.minusDays(1)
        assertTrue(
            checkNotNull(data.pageFor(filter.copy(from = emptyDay, to = emptyDay)))
                .meetings.isEmpty(),
        )
    }

    @Test fun incompleteMonthDoesNotClaimAnUnloadedDayIsEmpty() {
        val data = CalendarData(cachedPages = mapOf(month to sample.copy(nextCursor = "more")))
        assertNull(data.pageFor(filter))
    }

    @Test fun revokedMeetingIsRemovedFromAllCachedDays() {
        val id = sample.meetings.single().id
        val data = PrivateData(calendar = CalendarData(cachedPages = mapOf(filter to sample)))
            .changeAccess(id, false)
        assertTrue(checkNotNull(data.calendar.pageFor(filter)).meetings.isEmpty())
    }
}
