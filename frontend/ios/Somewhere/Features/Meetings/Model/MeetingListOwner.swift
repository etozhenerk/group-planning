import Foundation
import Observation

@MainActor @Observable
final class MeetingListOwner {
    let session: SessionStore
    var selection = MeetingCalendarSelection()
    var selectionID = UUID()
    var page = ResourceState<CalendarPage>()
    var month = ResourceState<CalendarPage>()
    var counts: CalendarPage.Counts?
    var countsTime: Date?
    var monthFilter: CalendarFilter?
    var loadedPages = 1
    var loadingMore = false
    var moreError: ClientFailure?
    var generation = UUID()
    var failures = 0
    @ObservationIgnored let lease: PrivateData.Lease?
    @ObservationIgnored var moreTask: Task<Void, Never>?
    @ObservationIgnored var actionTask: Task<Void, Never>?

    init(session: SessionStore) {
        self.session = session
        lease = try? session.privateData.lease()
    }

    var current: Bool {
        session.status == .authenticated && lease.map(session.privateData.isCurrent) == true
    }
    var empty: Bool {
        counts?.total == 0 && page.error == nil
            && (selection.display == .list || month.error == nil)
    }
    var items: [CalendarMeeting] {
        current
            ? (page.value?.meetings ?? []).filter { !session.privateData.denied.contains($0.id) }
            : []
    }
    var dayCount: Int? {
        if selection.undated { return counts?.undated }
        let data = page.value ?? month.value
        return data.map { $0.days.first { $0.date == selection.day }?.count ?? 0 }
            ?? (empty ? 0 : nil)
    }
    var emptyTitle: String {
        if selection.undated { return "Встреч без даты нет." }
        if selection.display == .calendar { return "На этот день встреч нет." }
        return selection.period == .past ? "Нет прошедших встреч" : "Нет предстоящих встреч"
    }

    func select(display: MeetingCalendarSelection.Display) {
        guard display != selection.display else { return }
        if display == .calendar, !selection.undated,
            selection.selected[selection.period] == nil, let first = page.value
        {
            selection.selected[selection.period] =
                first.meetings.first?.localDate ?? CalendarDate.today()
        }
        selection.display = display
        changed()
    }

    func select(period: MeetingPeriod) {
        guard period != selection.period || selection.undated else { return }
        selection.undated = false
        selection.period = period
        changed()
    }

    func select(day: String) {
        guard CalendarDate.parse(day) != nil else { return }
        selection.selected[selection.period] = day
        selection.undated = false
        changed()
    }

    func toggleUndated() {
        selection.undated.toggle()
        changed()
    }

    func changed() {
        cancel()
        page = ResourceState()
        loadedPages = 1
        moreError = nil
        if monthFilter != selection.monthFilter {
            month = ResourceState()
            monthFilter = nil
        }
        selectionID = UUID()
    }

    func observe() async {
        while !Task.isCancelled && current {
            await load()
            do {
                try await Task.sleep(
                    for: .seconds(
                        CalendarRefresh.delay(
                            page: page.value ?? month.value, failures: failures, now: Date())))
            } catch { return }
        }
    }

    func retry() { selectionID = UUID() }

    func loadMore() {
        guard !loadingMore, moreTask == nil, page.value?.nextCursor != nil else { return }
        moreTask = Task {
            await fetchMore()
            moreTask = nil
        }
    }

    func logout() {
        cancel()
        counts = nil
        page = ResourceState()
        month = ResourceState()
        actionTask = Task {
            do {
                try await session.logout()
            } catch {
                // SessionStore exposes a failed logout.
            }
            actionTask = nil
        }
    }

    func cancel() {
        generation = UUID()
        moreTask?.cancel()
        moreTask = nil
        loadingMore = false
        actionTask?.cancel()
        actionTask = nil
    }
}
