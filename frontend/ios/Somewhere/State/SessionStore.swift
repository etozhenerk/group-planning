import Foundation
import Observation

@MainActor @Observable
final class SessionStore {
    enum Status: Sendable { case signedOut, restoring, authenticated, failed, deleting }

    private(set) var status: Status = .signedOut
    private(set) var profile: UserProfile?
    private(set) var error: ClientFailure?
    private(set) var pendingDeletion: PendingAccountDeletion?
    private(set) var deletionBusy = false
    private(set) var deletionFailure: ClientFailure?
    private(set) var accountDeleted = false
    let privateData: PrivateData
    @ObservationIgnored let api: APIClient
    @ObservationIgnored let credentials: CredentialStore
    @ObservationIgnored private var credential: StoredSession?
    @ObservationIgnored private var generation = 0
    @ObservationIgnored private var restoreTask: Task<(StoredSession, UserProfile?)?, any Error>?
    @ObservationIgnored private var inFlight: [UUID: InFlight] = [:]

    private struct InFlight {
        let meetingID: UUID?
        let cancel: @Sendable () -> Void
    }

    init(api: APIClient, credentials: CredentialStore, privateData: PrivateData) {
        self.api = api
        self.credentials = credentials
        self.privateData = privateData
    }

    func restore() async {
        guard !deletionBusy else { return }
        await restore(candidate: nil)
    }

    func establish(_ credential: StoredSession) async { await restore(candidate: credential) }

    func accept(_ credential: StoredSession) async throws {
        guard pendingDeletion == nil && !deletionBusy else { throw ClientFailure.staleSession }
        try await credentials.save(credential, generation: generation)
        await restore()
    }

    private func restore(candidate: StoredSession?) async {
        reset()
        let version = generation
        status = .restoring
        let api = self.api
        let credentials = self.credentials
        let worker = Task<(StoredSession, UserProfile?)?, any Error> {
            let saved: StoredSession?
            if let candidate {
                saved = candidate
            } else {
                saved = try await credentials.load(generation: version)
            }
            guard let saved else { return nil }
            if saved.deletion != nil { return (saved, nil) }
            guard saved.expiresAt > Date() else {
                try await credentials.remove(generation: version)
                return nil
            }
            let me = try await api.send(
                SessionRequests.me, as: CurrentSession.self, credential: saved)
            try Task.checkCancellation()
            guard me.expiresAt.date > Date() else {
                try await credentials.remove(generation: version)
                return nil
            }
            let current = try StoredSession(
                token: saved.token, expiresAt: me.expiresAt.date, id: saved.id)
            try await credentials.save(current, generation: version)
            return (current, me.user)
        }
        restoreTask = worker
        defer { if generation == version { restoreTask = nil } }
        do {
            let result = try await withTaskCancellationHandler(
                operation: { try await worker.value },
                onCancel: { worker.cancel() })
            guard generation == version else { return }
            try Task.checkCancellation()
            if let (credential, profile) = result {
                self.credential = credential
                self.profile = profile
                pendingDeletion = credential.deletion
                status = credential.deletion == nil ? .authenticated : .deleting
            } else {
                status = .signedOut
            }
        } catch {
            guard generation == version else { return }
            if error is CancellationError {
                status = .signedOut
                return
            }
            if (error as? ClientFailure)?.statusCode == 401 {
                do { try await invalidate() } catch {
                    guard generation == version + 1 else { return }
                    self.error = .sanitized(error)
                    status = .failed
                }
                return
            }
            self.error = .sanitized(error)
            status = .failed
        }
    }

    func send<Value: Decodable & Sendable>(_ request: APIRequest, as type: Value.Type) async throws
        -> Value
    {
        let api = self.api
        return try await perform(request) { credential in
            try await api.send(request, as: type, credential: credential)
        }
    }

    func image(_ request: APIRequest) async throws -> Data {
        let api = self.api
        return try await perform(request) { credential in
            try await api.image(request, credential: credential)
        }
    }

    func media(_ request: APIRequest) async throws -> Data {
        let api = self.api
        return try await perform(request) { credential in
            try await api.media(request, credential: credential)
        }
    }

    private func perform<Value: Sendable>(
        _ request: APIRequest,
        operation: @escaping @Sendable (StoredSession) async throws -> Value
    ) async throws -> Value {
        guard let credential, status == .authenticated else { throw ClientFailure.http(401, nil) }
        guard credential.expiresAt > Date() else {
            try await invalidate()
            throw ClientFailure.http(401, nil)
        }
        let version = generation
        let lease = try privateData.lease(for: request.meetingID)
        let id = UUID()
        let worker = Task { try await operation(credential) }
        inFlight[id] = InFlight(meetingID: request.meetingID, cancel: { worker.cancel() })
        defer { inFlight.removeValue(forKey: id) }
        do {
            let value = try await withTaskCancellationHandler(
                operation: { try await worker.value },
                onCancel: { worker.cancel() })
            guard generation == version else { throw ClientFailure.staleSession }
            guard privateData.isCurrent(lease) else { throw ClientFailure.accessRevoked }
            return value
        } catch {
            guard generation == version else { throw ClientFailure.staleSession }
            if (error as? ClientFailure)?.statusCode == 401 {
                try await invalidate()
                throw error
            }
            guard privateData.isCurrent(lease) else { throw ClientFailure.accessRevoked }
            if (error as? ClientFailure)?.statusCode == 403, let meetingID = request.meetingID,
                request.invalidatesMeetingOnForbidden
            {
                privateData.revoke(meetingID)
                for request in inFlight.values where request.meetingID == meetingID {
                    request.cancel()
                }
            }
            throw error
        }
    }

    func updateMeetingAccess(_ id: UUID, allowed: Bool) {
        if allowed && !privateData.denied.contains(id) { return }
        for request in inFlight.values where request.meetingID == id { request.cancel() }
        if allowed { privateData.allow(id) } else { privateData.revoke(id) }
    }

    func logout() async throws {
        guard pendingDeletion == nil && !deletionBusy else { throw ClientFailure.staleSession }
        let old = credential
        try await invalidate()
        if let old { try await api.sendEmpty(SessionRequests.logout, credential: old) }
    }

    func deleteAccount(cleanup: (UUID) async throws -> Void) async {
        guard !deletionBusy else { return }
        deletionBusy = true
        deletionFailure = nil
        defer { deletionBusy = false }
        do {
            guard let saved = credential else { throw ClientFailure.http(401, nil) }
            let pending: PendingAccountDeletion
            if let previous = saved.deletion {
                pending = previous
            } else {
                guard let profile else { throw ClientFailure.http(401, nil) }
                pending = PendingAccountDeletion(
                    token: try AuthProof.generate().verifier, userID: profile.id)
            }
            let candidate = try StoredSession(
                token: saved.token, expiresAt: saved.expiresAt, id: saved.id, deletion: pending)
            try await credentials.save(candidate, generation: generation)
            reset()
            credential = candidate
            pendingDeletion = pending
            status = .deleting
            let version = generation
            try await api.sendEmpty(
                APIRequest(
                    path: ["me"], method: .delete, deletionToken: pending.token, expectedStatus: 204
                ), credential: candidate)
            guard generation == version else { throw ClientFailure.staleSession }
            try await cleanup(pending.userID)
            guard generation == version else { throw ClientFailure.staleSession }
            try await credentials.remove(generation: generation)
            reset()
            pendingDeletion = nil
            accountDeleted = true
        } catch {
            if !(error is CancellationError) { deletionFailure = .sanitized(error) }
        }
    }

    func leaveDeletion() async {
        guard !deletionBusy else { return }
        do {
            try await invalidate()
            pendingDeletion = nil
            deletionFailure = nil
        } catch { deletionFailure = .sanitized(error) }
    }

    func cancelRestore() {
        guard status == .restoring else { return }
        reset()
    }

    private func invalidate() async throws {
        reset()
        try await credentials.remove(generation: generation)
    }

    private func reset() {
        pendingDeletion = nil
        accountDeleted = false
        deletionFailure = nil
        generation += 1
        restoreTask?.cancel()
        restoreTask = nil
        for request in inFlight.values { request.cancel() }
        inFlight.removeAll()
        credential = nil
        profile = nil
        error = nil
        status = .signedOut
        privateData.clear()
    }
}
