import Foundation
import Observation

@MainActor @Observable
final class SessionStore {
    enum Status: Sendable { case signedOut, restoring, authenticated, failed }

    private(set) var status: Status = .signedOut
    private(set) var profile: UserProfile?
    private(set) var error: ClientFailure?
    let privateData: PrivateData
    @ObservationIgnored let api: APIClient
    @ObservationIgnored let credentials: CredentialStore
    @ObservationIgnored private var credential: StoredSession?
    @ObservationIgnored private var generation = 0
    @ObservationIgnored private var restoreTask: Task<(StoredSession, UserProfile)?, any Error>?
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

    func restore() async { await restore(candidate: nil) }

    func establish(_ credential: StoredSession) async { await restore(candidate: credential) }

    private func restore(candidate: StoredSession?) async {
        reset()
        let version = generation
        status = .restoring
        let api = self.api
        let credentials = self.credentials
        let worker = Task<(StoredSession, UserProfile)?, any Error> {
            let saved: StoredSession?
            if let candidate {
                saved = candidate
            } else {
                saved = try await credentials.load(generation: version)
            }
            guard let saved else { return nil }
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
                status = .authenticated
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
        guard let credential, status == .authenticated else { throw ClientFailure.http(401, nil) }
        guard credential.expiresAt > Date() else {
            try await invalidate()
            throw ClientFailure.http(401, nil)
        }
        let version = generation
        let lease = try privateData.lease(for: request.meetingID)
        let id = UUID()
        let api = self.api
        let worker = Task { try await api.send(request, as: type, credential: credential) }
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

    func logout() async throws {
        let old = credential
        try await invalidate()
        if let old { try await api.sendEmpty(SessionRequests.logout, credential: old) }
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
