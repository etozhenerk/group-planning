import Foundation
import Observation

@MainActor @Observable
final class InvitationOwner {
    let target: InvitationTarget
    let api: APIClient
    let session: SessionStore?
    let userID: UUID?
    var preview: InvitationPreview?
    var choice: RSVPAnswer?
    var answer: RSVPAnswer?
    var revision = ServerCounter.zero
    var loading = false
    var saving = false
    var unavailable = false
    var problem: String?
    var responseProblem: String?
    private var verifiedAccess = false
    private var verifiedOrganizer = false
    var canAccess: Bool {
        get { verifiedAccess && authenticated && current }
        set { verifiedAccess = newValue }
    }
    var organizer: Bool {
        get { verifiedOrganizer && authenticated && current }
        set { verifiedOrganizer = newValue }
    }
    var shareURL: URL?
    var shareProblem = false
    var pending: Submission?
    @ObservationIgnored var generation = UUID()
    @ObservationIgnored var operation: Task<Void, Never>?
    @ObservationIgnored let sessionLease: PrivateData.Lease?

    struct Submission: Sendable {
        let input: RSVPRequest
        let key: UUID
    }

    init(target: InvitationTarget, api: APIClient, session: SessionStore?) {
        self.target = target
        self.api = api
        self.session = session
        userID = session?.profile?.id
        sessionLease = try? session?.privateData.lease()
    }

    var authenticated: Bool {
        userID != nil && session?.profile?.id == userID && session?.status == .authenticated
    }
    var current: Bool {
        if let userID {
            return session?.profile?.id == userID && session?.status == .authenticated
                && sessionLease.map { session?.privateData.isCurrent($0) == true } == true
        }
        return session?.status != .authenticated
    }
    var editable: Bool { authenticated && !loading && !saving && pending == nil && !organizer }
    var joinClosed: Bool { joinClosed(at: Date()) }
    func joinClosed(at now: Date) -> Bool {
        guard answer != .going, !organizer else { return false }
        if preview?.canJoin == false { return true }
        let cutoff =
            preview?.joinClosesAt?.date ?? preview?.startsAt?.date.addingTimeInterval(-3600)
        return cutoff.map { now >= $0 } ?? false
    }
    var canSave: Bool {
        editable && choice != nil && choice != answer && !(choice == .going && joinClosed)
    }

    func choose(_ value: RSVPAnswer) {
        guard editable, !(value == .going && joinClosed) else { return }
        choice = value
        responseProblem = nil
    }

    func reload() {
        guard !saving else { return }
        operation?.cancel()
        operation = Task { await load() }
    }

    func save() {
        guard !loading, !saving, authenticated else { return }
        if pending == nil {
            guard canSave, let choice else { return }
            pending = Submission(
                input: RSVPRequest(answer: choice, expectedRevision: revision), key: UUID())
        }
        operation?.cancel()
        operation = Task { await submit() }
    }

    func suspend() {
        generation = UUID()
        operation?.cancel()
        operation = nil
        loading = false
        saving = false
    }

    func cancel() { suspend() }
}
