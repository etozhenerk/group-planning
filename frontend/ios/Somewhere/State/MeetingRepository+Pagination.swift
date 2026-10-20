import Foundation

extension MeetingRepository {
    func loadMoreMeetings() async {
        guard let cursor = state.meetingsCursor, !state.loadingMore,
            !state.meetings.isLoading, let lease = try? state.lease()
        else { return }
        let generation = state.listGeneration
        state.loadingMore = true
        state.moreError = nil
        defer {
            if state.isCurrent(lease), state.listGeneration == generation {
                state.loadingMore = false
            }
        }
        do {
            let page = try await session.send(
                MeetingRequests.list(cursor: cursor), as: MeetingsPage.self)
            guard state.isCurrent(lease), state.listGeneration == generation else { return }
            var items = state.meetings.value ?? []
            for item in page.meetings where !state.denied.contains(item.id) {
                if let index = items.firstIndex(where: { $0.id == item.id }) {
                    items[index] = item
                } else {
                    items.append(item)
                }
            }
            let token = state.meetings.begin()
            state.meetings.succeed(items, requestID: token)
            state.meetingsCursor = page.nextCursor == cursor ? nil : page.nextCursor
        } catch {
            guard state.isCurrent(lease), state.listGeneration == generation else { return }
            if !(error is CancellationError) { state.moreError = .sanitized(error) }
        }
    }
}
