import Foundation
import Testing

@testable import Somewhere

@MainActor
struct ChatSessionFenceTests {
    @Test func oldLogoutCannotRemoveCredentialSavedDuringChatCleanup() async throws {
        let chat = GatedChatStorage()
        defer { chat.finishCleanup() }
        let harness = try SessionHarness(chatStorage: chat)
        try await harness.login()
        let logout = Task { () -> ClientFailure? in
            do {
                try await harness.session.logout()
                return nil
            } catch { return error as? ClientFailure }
        }
        try await chat.waitUntilCleanup()
        let next = try StoredSession(
            token: "next-session", expiresAt: Date().addingTimeInterval(3600))
        var me = try #require(
            JSONSerialization.jsonObject(with: Fixtures.me(name: "Другой аккаунт"))
                as? [String: Any])
        var user = try #require(me["user"] as? [String: Any])
        let nextID = UUID()
        user["id"] = nextID.uuidString.lowercased()
        me["user"] = user
        await harness.transport.enqueue(
            "/api/v1/me", data: try JSONSerialization.data(withJSONObject: me))
        let login = Task { await harness.session.establish(next) }
        try await harness.transport.waitFor("/api/v1/me", count: 2)
        for _ in 0..<200 {
            if try harness.storage.load()?.token == next.token { break }
            try await Task.sleep(for: .milliseconds(10))
        }
        #expect(try harness.storage.load()?.token == next.token)
        #expect(harness.session.status == .restoring)
        chat.finishCleanup()
        await login.value
        let oldResult = await logout.value
        #expect(oldResult == .staleSession)
        #expect(harness.session.status == .authenticated && harness.session.profile?.id == nextID)
        #expect(try harness.storage.load()?.token == next.token)
    }
}
