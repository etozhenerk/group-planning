import Foundation
import Observation

@MainActor @Observable
final class ProfileOwner {
    let session: SessionStore
    private let userID: UUID?
    private let lease: PrivateData.Lease?
    private(set) var profile: AccountProfile?
    private(set) var loading = false
    private(set) var failed = false

    init(session: SessionStore) {
        self.session = session
        userID = session.profile?.id
        lease = try? session.privateData.lease()
    }
    var current: Bool {
        session.status == .authenticated && session.profile?.id == userID
            && lease.map { session.privateData.isCurrent($0) } == true
    }
    func load() async {
        guard current, !loading else { return }
        loading = true
        failed = false
        defer { loading = false }
        do {
            let result = try await session.send(ExperienceRequests.profile, as: AccountProfile.self)
            try Task.checkCancellation()
            guard current else { return }
            guard result.id == userID else { throw ClientFailure.invalidResponse }
            profile = result
        } catch {
            if current, !(error is CancellationError) { failed = true }
        }
    }
}
