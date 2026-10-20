import Foundation
import Testing

@testable import Somewhere

@MainActor
struct SessionStoreTests {
    @Test func restoreVerifiesProfileAndRejectsExpiredCredential() async throws {
        let valid = try SessionHarness()
        try await valid.login()
        #expect(valid.session.profile?.displayName == "Лена")
        let expired = try SessionHarness(expired: true)
        await expired.session.restore()
        #expect(expired.session.status == .signedOut)
        #expect(try expired.storage.load() == nil)
        #expect(await expired.transport.count("/api/v1/me") == 0)
    }

    @Test func keychainFailureDoesNotCreateSession() async throws {
        let harness = try SessionHarness(storageFailure: .keychain(-1))
        await harness.session.restore()
        #expect(harness.session.status == .failed)
        #expect(harness.session.profile == nil)
        #expect(await harness.transport.count("/api/v1/me") == 0)
    }

    @Test func unauthorizedClearsAllPrivateStateAndCredential() async throws {
        let harness = try SessionHarness()
        try await harness.login()
        let id = UUID()
        try harness.seed(id)
        await harness.transport.enqueue(
            "/api/v1/meetings", data: Data("unauthorized".utf8), status: 401, mime: "text/plain")
        await MeetingRepository(session: harness.session).loadMeetings()
        #expect(harness.session.status == .signedOut)
        #expect(harness.session.profile == nil)
        #expect(harness.session.privateData.details.isEmpty)
        #expect(harness.session.privateData.feeds.isEmpty)
        #expect(harness.session.privateData.participants.isEmpty)
        #expect(try harness.storage.load() == nil)
    }

    @Test func forbiddenReadClearsOnlyAffectedMeetingAndRejectsLateResponse() async throws {
        let harness = try SessionHarness()
        try await harness.login()
        let id = UUID()
        let other = UUID()
        try harness.seed(id)
        try harness.seed(other)
        let path = "/api/v1/meetings/\(id.uuidString.lowercased())"
        let gate = TestGate()
        await harness.transport.enqueue(
            path, data: try APICoding.encode(Fixtures.meeting(id)), gate: gate)
        let late = Task { await MeetingRepository(session: harness.session).loadMeeting(id) }
        try await harness.transport.waitFor(path)
        await harness.transport.enqueue(path + "/feed", status: 403)
        await MeetingRepository(session: harness.session).loadFeed(id)
        await gate.release()
        await late.value
        #expect(harness.session.status == .authenticated)
        #expect(harness.session.privateData.details[id] == nil)
        #expect(harness.session.privateData.feeds[id] == nil)
        #expect(harness.session.privateData.participants[id] == nil)
        #expect(harness.session.privateData.details[other]?.value != nil)
        #expect(try harness.storage.load() != nil)
    }

    @Test func organizerOnlyForbiddenDoesNotRevokeChat() async throws {
        let harness = try SessionHarness()
        try await harness.login()
        let id = UUID()
        try harness.seed(id)
        let path = "/api/v1/meetings/\(id.uuidString.lowercased())/invitation"
        await harness.transport.enqueue(path, status: 403)
        await #expect(throws: ClientFailure.http(403, nil)) {
            try await harness.session.send(MeetingRequests.invitation(id), as: InvitationLink.self)
        }
        #expect(harness.session.privateData.feeds[id]?.value != nil)
        #expect(!harness.session.privateData.denied.contains(id))
    }

    @Test func logoutClearsLocalStateEvenWhenServerFails() async throws {
        let harness = try SessionHarness()
        try await harness.login()
        try harness.seed(UUID())
        await harness.transport.enqueue("/api/v1/auth/logout", status: 503)
        await #expect(throws: ClientFailure.http(503, nil)) { try await harness.session.logout() }
        #expect(harness.session.status == .signedOut)
        #expect(harness.session.privateData.details.isEmpty)
        #expect(try harness.storage.load() == nil)
    }

    @Test func obsoleteRestoreCannotEraseNewSession() async throws {
        let harness = try SessionHarness()
        let gate = TestGate()
        await harness.transport.enqueue("/api/v1/me", status: 401, gate: gate)
        let old = Task { await harness.session.restore() }
        try await harness.transport.waitFor("/api/v1/me")
        await harness.transport.enqueue("/api/v1/me", data: try Fixtures.me(name: "Новый участник"))
        let replacement = try StoredSession(
            token: "new-session", expiresAt: Date().addingTimeInterval(3600))
        await harness.session.establish(replacement)
        await gate.release()
        await old.value
        #expect(harness.session.status == .authenticated)
        #expect(harness.session.profile?.displayName == "Новый участник")
        #expect(try harness.storage.load()?.token == "new-session")
    }

    @Test func canceledRestoreDoesNotAuthenticateLate() async throws {
        let harness = try SessionHarness()
        let gate = TestGate()
        await harness.transport.enqueue("/api/v1/me", data: try Fixtures.me(), gate: gate)
        let task = Task { await harness.session.restore() }
        try await harness.transport.waitFor("/api/v1/me")
        harness.session.cancelRestore()
        await gate.release()
        await task.value
        #expect(harness.session.status == .signedOut)
        #expect(harness.session.profile == nil)
    }
}
