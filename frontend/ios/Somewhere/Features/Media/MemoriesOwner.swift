import Foundation
import Observation

@MainActor @Observable
final class MemoriesOwner: Identifiable {
    let id: UUID
    let session: SessionStore
    let transfer: MediaTransferOwner
    private let lease: PrivateData.Lease?
    var photos: [MeetingMedia] = []
    var meeting: Meeting?
    var nextCursor: String?
    var loading = false
    var failed = false
    var loaded = false
    init(id: UUID, session: SessionStore) {
        self.id = id
        self.session = session
        transfer = MediaTransferOwner(id: id, session: session, purpose: "memory")
        lease = try? session.privateData.lease(for: id)
    }
    var current: Bool {
        session.status == .authenticated && lease.map { session.privateData.isCurrent($0) } == true
    }
    func load(more: Bool = false) async {
        guard current, !loading else { return }
        loading = true
        failed = false
        defer { loading = false }
        do {
            if meeting == nil {
                let value = try await session.send(MeetingRequests.details(id), as: Meeting.self)
                try Task.checkCancellation()
                guard current, value.id == id, value.period == "past" else { return }
                meeting = value
            }
            let result = try await session.send(
                ExperienceRequests.memories(id, cursor: more ? nextCursor : nil), as: MediaPage.self
            )
            try Task.checkCancellation()
            guard current else { return }
            guard result.photos.allSatisfy({ $0.meetingID == id && $0.purpose == "memory" }) else {
                throw ClientFailure.invalidResponse
            }
            var combined = more ? photos : []
            for photo in result.photos where !combined.contains(where: { $0.id == photo.id }) {
                combined.append(photo)
            }
            photos = combined
            nextCursor = result.nextCursor
            loaded = true
        } catch { if current, !(error is CancellationError) { failed = true } }
    }
    func clear() {
        transfer.suspend()
        photos = []
        meeting = nil
        nextCursor = nil
        loaded = false
    }
}
