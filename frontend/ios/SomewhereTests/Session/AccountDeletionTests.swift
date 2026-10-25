import Foundation
import Testing

@testable import Somewhere

@MainActor
struct AccountDeletionTests {
    @Test func completionClearsCredentialsAndPrivateState() async throws {
        let harness = try SessionHarness()
        try await harness.login()
        let userID = try #require(harness.session.profile?.id)
        try harness.seed(UUID())
        await harness.transport.enqueue("/api/v1/me", status: 204)
        var cleaned: UUID?
        await harness.session.deleteAccount { cleaned = $0 }
        #expect(cleaned == userID)
        #expect(harness.session.accountDeleted)
        #expect(harness.session.status == .signedOut)
        #expect(harness.session.privateData.details.isEmpty)
        #expect(try harness.storage.load() == nil)
        let requests = await harness.transport.requests
        #expect(requests.last?.httpMethod == "DELETE")
        #expect(requests.last?.value(forHTTPHeaderField: "X-Deletion-Token")?.count == 43)
    }

    @Test func failedResponseRestoresPendingOperationBeforeSessionCheck() async throws {
        let harness = try SessionHarness()
        try await harness.login()
        await harness.transport.enqueue("/api/v1/me", status: 503)
        await harness.session.deleteAccount { _ in Issue.record("cleanup before confirmation") }
        let pending = try #require(try harness.storage.load()?.deletion)
        #expect(!harness.session.accountDeleted)
        let restored = SessionStore(
            api: harness.session.api, credentials: CredentialStore(storage: harness.storage),
            privateData: PrivateData())
        let before = await harness.transport.count("/api/v1/me")
        await restored.restore()
        #expect(restored.status == .deleting)
        #expect(await harness.transport.count("/api/v1/me") == before)
        await harness.transport.enqueue("/api/v1/me", status: 204)
        await restored.deleteAccount { _ in }
        #expect(restored.accountDeleted)
        let requests = await harness.transport.requests
        #expect(requests.last?.value(forHTTPHeaderField: "X-Deletion-Token") == pending.token)
    }

    @Test func unauthorizedDoesNotClaimSuccessAndConcurrentClickDoesNotSendAgain() async throws {
        let harness = try SessionHarness()
        try await harness.login()
        let gate = TestGate()
        await harness.transport.enqueue("/api/v1/me", status: 401, gate: gate)
        let request = Task { await harness.session.deleteAccount { _ in } }
        try await harness.transport.waitFor("/api/v1/me", count: 2)
        await harness.session.deleteAccount { _ in Issue.record("duplicate") }
        #expect(await harness.transport.count("/api/v1/me") == 2)
        await gate.release()
        await request.value
        #expect(!harness.session.accountDeleted)
        #expect(harness.session.deletionFailure?.statusCode == 401)
        #expect(try harness.storage.load()?.deletion != nil)
    }
}
