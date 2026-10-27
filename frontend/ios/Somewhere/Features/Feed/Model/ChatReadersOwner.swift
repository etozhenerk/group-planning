import Foundation
import Observation

@MainActor @Observable
final class ChatReadersOwner {
    let meetingID: UUID
    let entryID: UUID
    let session: SessionStore
    let lease: PrivateData.Lease?
    var people: [UserProfile] = []
    var loading = false
    var loaded = false
    var problem: String?
    var nextCursor: String?
    var count: ServerCounter?
    private var version = UUID()
    private var resetRequested = false
    init(meetingID: UUID, entryID: UUID, session: SessionStore) {
        self.meetingID = meetingID
        self.entryID = entryID
        self.session = session
        lease = try? session.privateData.lease(for: meetingID)
    }
    var current: Bool {
        session.status == .authenticated && lease.map { session.privateData.isCurrent($0) } == true
    }
    func load(reset: Bool = false) async {
        guard current else { return }
        if loading {
            resetRequested = resetRequested || reset
            return
        }
        if loaded && !reset && nextCursor == nil { return }
        let stamp = version
        loading = true
        problem = nil
        defer {
            if version == stamp {
                loading = false
                if resetRequested {
                    resetRequested = false
                    Task { await load(reset: true) }
                }
            }
        }
        do {
            let cursor = reset ? nil : nextCursor
            let page = try await session.send(
                ChatReadRequests.readers(meetingID, entry: entryID, cursor: cursor),
                as: ChatReaderPage.self)
            try Task.checkCancellation()
            guard current, version == stamp else { return }
            guard page.nextCursor == nil || page.nextCursor != cursor else {
                throw ClientFailure.invalidResponse
            }
            if reset { people = [] }
            let ids = Set(people.map(\.id))
            people += page.readers.filter { !ids.contains($0.id) }
            count = page.readerCount
            nextCursor = page.nextCursor
            loaded = true
        } catch {
            if current, version == stamp, !(error is CancellationError) {
                problem = "Не удалось загрузить список"
            }
        }
    }
    func suspend() {
        version = UUID()
        resetRequested = false
        loading = false
    }
}
