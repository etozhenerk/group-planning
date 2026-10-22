import Foundation

extension MeetingListOwner {
    func load(resetPages: Bool = false) async {
        guard current, !loadingMore else { return }
        generation = UUID()
        let run = generation
        let token = page.begin()
        moreError = nil
        do {
            if selection.display == .calendar, selection.selected[selection.period] == nil {
                let initial = try await session.send(
                    CalendarFilter(period: selection.period).request(), as: CalendarPage.self)
                guard valid(run) else { return }
                acceptCounts(initial)
                selection.selected[selection.period] =
                    initial.meetings.first?.localDate ?? CalendarDate.today()
            }
            if selection.display == .calendar {
                await loadMonth(run: run)
                guard valid(run) else { return }
            }
            let filter = selection.filter
            var result = try await session.send(filter.request(), as: CalendarPage.self)
            var fetched = 1
            let target = resetPages ? 1 : loadedPages
            while fetched < target, let cursor = result.nextCursor {
                let next = try await session.send(
                    filter.request(cursor: cursor), as: CalendarPage.self)
                result = merged(result, with: next)
                fetched += 1
            }
            guard valid(run) else { return }
            loadedPages = fetched
            page.succeed(result, requestID: token)
            acceptCounts(result)
            failures = month.error == nil ? 0 : failures + 1
        } catch {
            guard valid(run) else { return }
            if isChanged(error), !resetPages {
                loadedPages = 1
                page = ResourceState()
                await load(resetPages: true)
            } else {
                page.fail(error, requestID: token)
                if !(error is CancellationError) { failures += 1 }
            }
        }
    }

    private func loadMonth(run: UUID) async {
        let filter = selection.monthFilter
        if filter != monthFilter {
            month = ResourceState()
            monthFilter = filter
        }
        let token = month.begin()
        do {
            let result = try await session.send(filter.request(), as: CalendarPage.self)
            guard valid(run) else { return }
            month.succeed(result, requestID: token)
            acceptCounts(result)
        } catch {
            guard valid(run) else { return }
            month.fail(error, requestID: token)
        }
    }

    func fetchMore() async {
        guard current, let previous = page.value, let cursor = previous.nextCursor else { return }
        loadingMore = true
        moreError = nil
        let run = generation
        let filter = selection.filter
        defer { if generation == run { loadingMore = false } }
        do {
            let next = try await session.send(filter.request(cursor: cursor), as: CalendarPage.self)
            guard valid(run) else { return }
            let token = page.begin()
            page.succeed(merged(previous, with: next), requestID: token)
            loadedPages += 1
            acceptCounts(next)
        } catch {
            guard valid(run) else { return }
            if isChanged(error) {
                loadingMore = false
                loadedPages = 1
                page = ResourceState()
                await load(resetPages: true)
            } else if !(error is CancellationError) {
                moreError = ClientFailure.sanitized(error)
            }
        }
    }

    private func valid(_ run: UUID) -> Bool { current && generation == run && !Task.isCancelled }

    private func acceptCounts(_ result: CalendarPage) {
        guard countsTime.map({ result.asOf.date >= $0 }) ?? true else { return }
        counts = result.counts
        countsTime = result.asOf.date
    }

    private func merged(_ first: CalendarPage, with next: CalendarPage) -> CalendarPage {
        var result = first
        var ids = Set(first.meetings.map(\.id))
        result.meetings += next.meetings.filter { ids.insert($0.id).inserted }
        result.nextCursor = next.nextCursor
        return result
    }

    private func isChanged(_ error: any Error) -> Bool {
        if case ClientFailure.http(409, let problem) = error {
            return problem?.code == "calendar_changed"
        }
        return false
    }
}
