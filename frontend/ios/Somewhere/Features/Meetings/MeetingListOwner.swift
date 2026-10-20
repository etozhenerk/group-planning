import Foundation
import Observation

@MainActor @Observable
final class MeetingListOwner {
    let session: SessionStore
    var state: PrivateData { session.privateData }
    @ObservationIgnored private var refreshTask: Task<Void, Never>?
    @ObservationIgnored private var moreTask: Task<Void, Never>?
    init(session: SessionStore) { self.session = session }
    func load() async { await MeetingRepository(session: session).loadMeetings() }
    func loadMore() {
        guard moreTask == nil else { return }
        moreTask = Task {
            await MeetingRepository(session: session).loadMoreMeetings()
            moreTask = nil
        }
    }
    func retry() {
        refreshTask?.cancel()
        refreshTask = Task {
            await load()
            refreshTask = nil
        }
    }
    func logout() {
        refreshTask?.cancel()
        refreshTask = Task {
            try? await session.logout()
            refreshTask = nil
        }
    }
    func cancel() {
        moreTask?.cancel()
        moreTask = nil
        refreshTask?.cancel()
        refreshTask = nil
    }
}
