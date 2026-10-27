package dev.groupplanning.android.calendar

import dev.groupplanning.android.data.api.WireResponse
import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.CalendarCounts
import dev.groupplanning.android.data.api.models.CalendarPage
import dev.groupplanning.android.data.api.models.ChatReadInfo
import dev.groupplanning.android.data.api.models.MeetingPeriod
import dev.groupplanning.android.data.api.models.ServerCounter
import dev.groupplanning.android.data.api.requests.CalendarFilter
import dev.groupplanning.android.data.repository.CalendarRepository
import dev.groupplanning.android.data.repository.ChatViewport
import dev.groupplanning.android.support.Fixtures
import dev.groupplanning.android.support.SessionHarness
import java.util.UUID
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.cancelAndJoin
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.encodeToString
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class CalendarRepositoryTests {
    private val filter = CalendarFilter(MeetingPeriod.Upcoming)
    private val sample = apiJson.decodeFromString<CalendarPage>(Fixtures.json("calendar-upcoming"))

    @Test fun calendarLoadsMeetingWithDayAndNoTime() = runTest {
        val h = SessionHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val repository = CalendarRepository(h.session)
        val meeting = sample.meetings.single().copy(
            startsAt = null,
            startsOn = sample.meetings.single().localDate,
        )
        val page = sample.copy(meetings = listOf(meeting))
        h.transport.enqueue("meetings", apiJson.encodeToString(page))
        repository.load(filter, null)
        val loaded = h.session.state.value.data.calendar
        assertNull(loaded.error)
        assertEquals(meeting, loaded.page?.meetings?.single())
    }

    @Test fun paginationConflictDropsOldPagesAndPreservesFilter() = runTest {
        val h = SessionHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val repository = CalendarRepository(h.session)
        h.transport.enqueue("meetings", apiJson.encodeToString(sample.copy(nextCursor = "next")))
        repository.load(filter, null)
        h.transport.enqueue("meetings", Fixtures.json("calendar-changed"), status = 409)
        h.transport.enqueue("meetings", apiJson.encodeToString(sample.copy(meetings = emptyList())))
        repository.more()
        val data = h.session.state.value.data.calendar
        assertTrue(checkNotNull(data.page).meetings.isEmpty())
        assertEquals(filter, data.filter)
        assertEquals(1, data.pages)
        assertNull(data.moreError)
    }

    @Test fun refreshRetainsLoadedPagesAndDeduplicates() = runTest {
        val h = SessionHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val repository = CalendarRepository(h.session)
        val second = sample.copy(
            meetings = listOf(sample.meetings.single().copy(id = UUID.randomUUID())),
        )
        h.transport.enqueue("meetings", apiJson.encodeToString(sample.copy(nextCursor = "next")))
        repository.load(filter, null)
        h.transport.enqueue(
            "meetings",
            apiJson.encodeToString(
                second.copy(
                    meetings =
                    sample.meetings + second.meetings,
                ),
            ),
        )
        repository.more()
        assertEquals(2, h.session.state.value.data.calendar.page?.meetings?.size)
        h.transport.enqueue("meetings", apiJson.encodeToString(sample.copy(nextCursor = "fresh")))
        h.transport.enqueue("meetings", apiJson.encodeToString(second))
        repository.load(filter, null)
        assertEquals(2, h.session.state.value.data.calendar.pages)
        assertEquals("fresh", h.transport.requests.last().url.queryParameter("cursor"))
    }

    @Test fun staleMonthCannotReplaceNewerSelectionAndCountsSurviveLoading() = runTest {
        val h = SessionHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val repository = CalendarRepository(h.session)
        h.transport.enqueue("meetings", apiJson.encodeToString(sample))
        repository.load(filter, null)
        val gate = CompletableDeferred<Unit>()
        val started = CompletableDeferred<Unit>()
        h.transport.handle("meetings") {
            started.complete(Unit)
            gate.await()
            WireResponse(200, "application/json", apiJson.encodeToString(sample))
        }
        val old = launch { repository.load(filter, null) }
        started.await()
        assertEquals(sample.counts, h.session.state.value.data.calendar.counts)
        h.transport.enqueue("meetings", apiJson.encodeToString(sample.copy(meetings = emptyList())))
        val past = CalendarFilter(MeetingPeriod.Past)
        repository.load(past, null)
        gate.complete(Unit)
        old.join()
        assertEquals(past, h.session.state.value.data.calendar.filter)
        assertTrue(checkNotNull(h.session.state.value.data.calendar.page).meetings.isEmpty())
    }

    @Test fun errorsKeepDataAndCancellationClearsLoading() = runTest {
        val h = SessionHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val repository = CalendarRepository(h.session)
        h.transport.enqueue("meetings", apiJson.encodeToString(sample))
        repository.load(filter, null)
        h.transport.enqueue("meetings", status = 503)
        repository.load(filter, null)
        assertEquals(sample, h.session.state.value.data.calendar.page)
        assertNotNull(h.session.state.value.data.calendar.error)
        val started = CompletableDeferred<Unit>()
        h.transport.handle("meetings") {
            started.complete(Unit)
            CompletableDeferred<WireResponse>().await()
        }
        val loading = launch { repository.load(filter, null) }
        started.await()
        loading.cancelAndJoin()
        assertNull(h.session.state.value.data.calendar.request)
    }

    @Test fun serverTransitionMovesMeetingOnlyAfterRefreshAndLogoutClearsCalendar() = runTest {
        val h = SessionHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val repository = CalendarRepository(h.session)
        h.transport.enqueue("meetings", apiJson.encodeToString(sample))
        repository.load(filter, null)
        h.transport.enqueue(
            "meetings",
            apiJson.encodeToString(
                sample.copy(
                    meetings = emptyList(),
                    counts = CalendarCounts(0, 2, 1),
                ),
            ),
        )
        repository.load(filter, null)
        assertEquals(0, h.session.state.value.data.calendar.counts?.upcoming)
        assertTrue(checkNotNull(h.session.state.value.data.calendar.page).meetings.isEmpty())
        h.transport.enqueue("auth/logout", status = 204)
        h.session.logout()
        assertNull(h.session.state.value.data.calendar.page)
        assertNull(h.session.state.value.data.calendar.counts)
    }

    @Test fun aCalendarResponseStartedBeforeReadCannotRestoreUnreadOrRevokedAnchor() = runTest {
        val h = SessionHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val repository = CalendarRepository(h.session)
        val meeting = sample.meetings.single()
        val zero = ServerCounter.Zero
        val info = ChatReadInfo(zero, zero, zero, null)
        val gate = CompletableDeferred<Unit>()
        val started = CompletableDeferred<Unit>()
        h.transport.handle("meetings") {
            started.complete(Unit)
            gate.await()
            WireResponse(
                200,
                "application/json",
                apiJson.encodeToString(
                    sample.copy(
                        meetings = listOf(
                            meeting.copy(
                                unreadCount = ServerCounter(
                                    "9",
                                ),
                            ),
                        ),
                    ),
                ),
            )
        }
        val old = launch { repository.load(filter, null) }
        started.await()
        h.session.beginData {
            it.copy(
                chatReadInfo = mapOf(meeting.id to info),
                readVersions = mapOf(
                    meeting.id to ServerCounter("12"),
                ),
                chatViewports = mapOf(
                    meeting.id to
                        ChatViewport(
                            UUID.randomUUID(),
                            -8f,
                            false,
                        ),
                ),
            )
        }
        gate.complete(Unit)
        old.join()
        assertEquals(
            zero,
            h.session.state.value.data.calendar.page?.meetings?.single()?.unreadCount,
        )
        h.session.updateAccess(meeting.id, false, h.session.state.value.generation)
        assertTrue(h.session.state.value.data.chatViewports.isEmpty())
        assertTrue(h.session.state.value.data.chatReadInfo.isEmpty())
        assertTrue(h.session.state.value.data.readVersions.isEmpty())
    }
}
