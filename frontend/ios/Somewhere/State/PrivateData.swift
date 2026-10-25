import Foundation
import Observation

@MainActor @Observable
final class PrivateData {
    var meetings = ResourceState<[MeetingSummary]>()
    var meetingsCursor: String?
    var loadingMore = false
    var moreError: ClientFailure?
    var listGeneration = UUID()
    var details: [UUID: ResourceState<Meeting>] = [:]
    var feeds: [UUID: ResourceState<FeedPage>] = [:]
    var participants: [UUID: ResourceState<Participants>] = [:]
    private(set) var denied: Set<UUID> = []
    private var generation = UUID()
    private var accessGeneration: [UUID: UUID] = [:]

    struct Lease: Sendable, Hashable {
        let generation: UUID
        let meetingID: UUID?
        let accessGeneration: UUID?
    }

    func lease(for meetingID: UUID? = nil) throws -> Lease {
        if let meetingID, denied.contains(meetingID) { throw ClientFailure.accessRevoked }
        return Lease(
            generation: generation, meetingID: meetingID,
            accessGeneration: meetingID.flatMap { accessGeneration[$0] })
    }

    func isCurrent(_ lease: Lease) -> Bool {
        guard generation == lease.generation else { return false }
        guard let id = lease.meetingID else { return true }
        return !denied.contains(id) && accessGeneration[id] == lease.accessGeneration
    }

    func revoke(_ id: UUID) {
        denied.insert(id)
        accessGeneration[id] = UUID()
        details.removeValue(forKey: id)
        feeds.removeValue(forKey: id)
        participants.removeValue(forKey: id)
        if let value = meetings.value {
            let token = meetings.begin()
            meetings.succeed(value.filter { $0.id != id }, requestID: token)
        }
    }

    func allow(_ id: UUID) {
        denied.remove(id)
        accessGeneration[id] = UUID()
    }

    func clear() {
        generation = UUID()
        meetings = ResourceState()
        meetingsCursor = nil
        loadingMore = false
        moreError = nil
        listGeneration = UUID()
        details.removeAll()
        feeds.removeAll()
        participants.removeAll()
        denied.removeAll()
        accessGeneration.removeAll()
    }
}
