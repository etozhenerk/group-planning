package dev.groupplanning.android.calendar

import androidx.lifecycle.SavedStateHandle
import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.ApiInstant
import dev.groupplanning.android.data.api.models.CalendarPage
import dev.groupplanning.android.data.api.models.MeetingPeriod
import dev.groupplanning.android.data.realtime.ChatSignal
import dev.groupplanning.android.data.repository.CalendarRepository
import dev.groupplanning.android.state.CalendarSelection
import dev.groupplanning.android.state.CalendarViewModel
import dev.groupplanning.android.support.Fixtures
import dev.groupplanning.android.support.SessionHarness
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.ZoneOffset
import kotlinx.coroutines.cancelAndJoin
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.encodeToString
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

@OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)
class CalendarLifecycleTests {
    @Test fun pollingRefreshesAtBoundaryStopsInBackgroundAndReloadsOnReturn() = runTest {
        val h = SessionHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val start = Instant.parse("2026-10-24T20:59:59Z")
        val clock = object : Clock() {
            override fun getZone(): ZoneId = ZoneOffset.UTC
            override fun withZone(zone: ZoneId): Clock = this
            override fun instant(): Instant = start.plusMillis(testScheduler.currentTime)
        }
        val sample = apiJson.decodeFromString<CalendarPage>(Fixtures.json("calendar-upcoming"))
            .copy(nextTransitionAt = ApiInstant("2026-10-24T21:00:00Z"))
        val after = sample.copy(meetings = emptyList())
        val repository = CalendarRepository(h.session)
        val model = CalendarViewModel(repository, SavedStateHandle(), backgroundScope, clock)
        h.transport.enqueue("meetings", apiJson.encodeToString(sample))
        val watcher = backgroundScope.launch { model.observe() }
        runCurrent()
        assertEquals(1, h.session.state.value.data.calendar.page?.meetings?.size)
        h.transport.enqueue("meetings", apiJson.encodeToString(after))
        advanceTimeBy(1000)
        runCurrent()
        assertTrue(checkNotNull(h.session.state.value.data.calendar.page).meetings.isEmpty())
        watcher.cancelAndJoin()
        val requests = h.transport.requests.size
        advanceTimeBy(20_000)
        runCurrent()
        assertEquals(requests, h.transport.requests.size)
        h.transport.enqueue("meetings", apiJson.encodeToString(sample))
        backgroundScope.launch { model.observe() }
        runCurrent()
        assertEquals(requests + 1, h.transport.requests.size)
    }

    @Test fun savedSelectionRestoresMonthPeriodAndDisplayAfterOwnerRecreation() = runTest {
        val h = SessionHarness(StandardTestDispatcher(testScheduler))
        val saved = SavedStateHandle()
        val repository = CalendarRepository(h.session)
        val model = CalendarViewModel(repository, saved, backgroundScope)
        val selection = CalendarSelection(calendar = true, period = MeetingPeriod.Past)
            .select(LocalDate.parse("2026-09-20"))
        model.select(selection)
        val restored = CalendarViewModel(repository, saved, backgroundScope)
        assertEquals(selection, restored.selection.value)
    }

    @Test fun personalSubscriptionHasNoIdlePollingButStillHonorsCalendarTimeBoundary() = runTest {
        val h = SessionHarness(StandardTestDispatcher(testScheduler))
        h.login()
        val start = Instant.parse("2026-10-24T20:59:59Z")
        val clock = object : Clock() {
            override fun getZone(): ZoneId = ZoneOffset.UTC
            override fun withZone(zone: ZoneId): Clock = this
            override fun instant(): Instant = start.plusMillis(testScheduler.currentTime)
        }
        val sample = apiJson.decodeFromString<CalendarPage>(Fixtures.json("calendar-upcoming"))
            .copy(nextTransitionAt = ApiInstant("2026-10-24T21:00:00Z"))
        val signals = MutableSharedFlow<ChatSignal>()
        val model =
            CalendarViewModel(
                CalendarRepository(h.session),
                SavedStateHandle(),
                backgroundScope,
                clock,
            ) {
                signals
            }
        h.transport.enqueue("meetings", apiJson.encodeToString(sample))
        val watcher = backgroundScope.launch { model.observe() }
        runCurrent()
        h.transport.enqueue("meetings", apiJson.encodeToString(sample))
        signals.emit(ChatSignal.Subscribed)
        runCurrent()
        val before = h.transport.requests.size
        h.transport.enqueue(
            "meetings",
            apiJson.encodeToString(sample.copy(nextTransitionAt = null)),
        )
        advanceTimeBy(1000)
        runCurrent()
        assertEquals(before + 1, h.transport.requests.size)
        advanceTimeBy(60_000)
        runCurrent()
        assertEquals(before + 1, h.transport.requests.size)
        h.transport.enqueue(
            "meetings",
            apiJson.encodeToString(sample.copy(nextTransitionAt = null)),
        )
        signals.emit(ChatSignal.PersonalChanged)
        advanceTimeBy(100)
        runCurrent()
        assertEquals(before + 2, h.transport.requests.size)
        watcher.cancelAndJoin()
        advanceTimeBy(60_000)
        assertEquals(before + 2, h.transport.requests.size)
    }
}
