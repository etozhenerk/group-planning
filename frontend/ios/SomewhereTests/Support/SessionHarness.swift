import Foundation
import Testing
import os

@testable import Somewhere

final class MemoryCredentialStorage: CredentialStorage, Sendable {
    private let value: OSAllocatedUnfairLock<StoredSession?>
    let failure: ClientFailure?

    init(_ credential: StoredSession? = nil, failure: ClientFailure? = nil) {
        value = OSAllocatedUnfairLock(initialState: credential)
        self.failure = failure
    }

    func load() throws -> StoredSession? {
        if let failure { throw failure }
        return value.withLock { $0 }
    }
    func save(_ credential: StoredSession) throws {
        if let failure { throw failure }
        value.withLock { $0 = credential }
    }
    func remove() throws {
        if let failure { throw failure }
        value.withLock { $0 = nil }
    }
}

@MainActor
struct SessionHarness {
    let transport = TestTransport()
    let storage: MemoryCredentialStorage
    let session: SessionStore

    init(expired: Bool = false, storageFailure: ClientFailure? = nil) throws {
        let credential = try StoredSession(
            token: "test-session", expiresAt: Date().addingTimeInterval(expired ? -60 : 3600))
        storage = MemoryCredentialStorage(credential, failure: storageFailure)
        let url = try #require(URL(string: "https://api.example.test"))
        let api = try APIClient(origin: APIOrigin(url), transport: transport)
        session = SessionStore(
            api: api, credentials: CredentialStore(storage: storage), privateData: PrivateData())
    }

    func login(name: String = "Лена") async throws {
        await transport.enqueue("/api/v1/me", data: try Fixtures.me(name: name))
        await session.restore()
        #expect(session.status == .authenticated)
    }

    func seed(_ id: UUID) throws {
        let state = session.privateData
        state.details[id] = ResourceState()
        if let token = state.details[id]?.begin() {
            state.details[id]?.succeed(try Fixtures.meeting(id), requestID: token)
        }
        state.feeds[id] = ResourceState()
        if let token = state.feeds[id]?.begin() {
            state.feeds[id]?.succeed(try Fixtures.feed(id), requestID: token)
        }
        state.participants[id] = ResourceState()
        if let token = state.participants[id]?.begin() {
            state.participants[id]?.succeed(Participants(participants: []), requestID: token)
        }
    }
}
