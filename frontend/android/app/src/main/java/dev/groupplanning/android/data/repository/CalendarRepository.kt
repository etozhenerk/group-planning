package dev.groupplanning.android.data.repository

import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.api.models.CalendarPage
import dev.groupplanning.android.data.api.models.MeetingPeriod
import dev.groupplanning.android.data.api.requests.CalendarFilter
import dev.groupplanning.android.data.session.SessionRepository
import java.time.LocalDate
import java.util.UUID
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.withContext

internal class CalendarRepository(private val session: SessionRepository) {
    val state = session.state

    suspend fun firstDay(period: MeetingPeriod): LocalDate {
        val page = session.authenticated(
            CalendarFilter(period).request(),
            CalendarPage.serializer(),
        )
        return page.meetings.firstOrNull()?.localDate?.let(LocalDate::parse) ?: LocalDate.now()
    }

    suspend fun load(filter: CalendarFilter, month: CalendarFilter?, reset: Boolean = false) {
        val request = UUID.randomUUID()
        val version = session.beginData { data ->
            val old = data.calendar
            val same = old.filter == filter && old.monthFilter == month && !reset
            data.copy(
                calendar = old.copy(
                    filter = filter, monthFilter = month, request = request, more = null,
                    page = old.page.takeIf { same }, days = old.days.takeIf { same }.orEmpty(),
                    pages = if (same) old.pages else 1, error = null, moreError = null,
                ),
            )
        } ?: return
        val pages = state.value.data.calendar.pages
        try {
            var page = fetch(filter, version)
            var loaded = 1
            while (loaded < pages && page.nextCursor != null) {
                val next = fetch(filter, version, page.nextCursor)
                page = next.copy(meetings = (page.meetings + next.meetings).distinctBy { it.id })
                loaded++
            }
            val monthPage = month?.let { fetch(it, version) } ?: page
            session.updateData(version) { data ->
                if (data.calendar.request != request) {
                    data
                } else {
                    data.copy(
                        calendar = data.calendar.copy(
                            page = page.copy(
                                meetings = page.meetings.filter {
                                    it.id !in data.denied
                                },
                            ),
                            counts = monthPage.counts,
                            days = monthPage.days,
                            pages = loaded,
                            request = null,
                            failures = 0,
                        ),
                    )
                }
            }
        } catch (cancelled: CancellationException) {
            withContext(NonCancellable) {
                session.updateData(version) { data ->
                    if (data.calendar.request != request) {
                        data
                    } else {
                        data.copy(
                            calendar = data.calendar.copy(request = null),
                        )
                    }
                }
            }
            throw cancelled
        } catch (error: ClientFailure) {
            if (state.value.data.calendar.request != request) return
            if (!reset && error.problem?.code == "calendar_changed") {
                load(filter, month, reset = true)
            } else {
                session.updateData(version) { data ->
                    if (data.calendar.request != request) {
                        data
                    } else {
                        data.copy(
                            calendar = data.calendar.copy(
                                request = null,
                                error = error,
                                failures = data.calendar.failures + 1,
                            ),
                        )
                    }
                }
            }
        }
    }

    suspend fun more() {
        val before = state.value.data.calendar
        val cursor = before.page?.nextCursor ?: return
        val filter = before.filter ?: return
        if (before.request != null || before.more != null) return
        val request = UUID.randomUUID()
        val version = session.beginData {
            it.copy(calendar = it.calendar.copy(more = request, moreError = null))
        } ?: return
        try {
            val page = fetch(filter, version, cursor)
            session.updateData(version) { data ->
                if (data.calendar.more != request) {
                    data
                } else {
                    data.copy(
                        calendar = data.calendar.copy(
                            page = page.copy(
                                meetings = (
                                    before.page.meetings + page.meetings
                                    ).distinctBy { it.id }.filter { it.id !in data.denied },
                            ),
                            counts = page.counts,
                            pages = before.pages + 1,
                            more = null,
                        ),
                    )
                }
            }
        } catch (cancelled: CancellationException) {
            withContext(NonCancellable) {
                session.updateData(version) { data ->
                    if (data.calendar.more != request) {
                        data
                    } else {
                        data.copy(
                            calendar = data.calendar.copy(more = null),
                        )
                    }
                }
            }
            throw cancelled
        } catch (error: ClientFailure) {
            if (state.value.data.calendar.more != request) return
            if (error.problem?.code == "calendar_changed") {
                load(filter, before.monthFilter, reset = true)
            } else {
                session.updateData(version) { data ->
                    if (data.calendar.more != request) {
                        data
                    } else {
                        data.copy(
                            calendar = data.calendar.copy(more = null, moreError = error),
                        )
                    }
                }
            }
        }
    }

    private suspend fun fetch(filter: CalendarFilter, version: Long, cursor: String? = null) =
        session.authenticated(filter.request(cursor), CalendarPage.serializer(), version)
}
