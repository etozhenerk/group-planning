import Foundation
import Testing

@testable import Somewhere

@MainActor
struct SavedInvitationsOwnerTests {
    private func page(ids: [UUID], cursor: String? = nil, answer: String = "maybe") throws -> Data {
        let source =
            try JSONSerialization.jsonObject(with: Fixtures.data("saved-invitations"))
            as? [String: Any]
        let item = try #require((source?["invitations"] as? [[String: Any]])?.first)
        let invitations = ids.map { id -> [String: Any] in
            var result = item
            var preview = item["preview"] as? [String: Any] ?? [:]
            preview["meeting_id"] = id.uuidString
            preview["my_rsvp"] = answer
            result["preview"] = preview
            result["invitation_url"] = "https://api.example.test/i/QUFBQUFBQUFBQUFBQUFBQQ"
            return result
        }
        return try JSONSerialization.data(withJSONObject: [
            "invitations": invitations, "next_cursor": cursor as Any? ?? NSNull(),
        ])
    }

    @Test func paginationDeduplicatesAndRefreshRetainsLoadedPages() async throws {
        let h = try SessionHarness()
        try await h.login()
        let owner = SavedInvitationsOwner(session: h.session)
        let first = UUID()
        let second = UUID()
        await h.transport.enqueue(
            "/api/v1/invitations", data: try page(ids: [first], cursor: "next"))
        await owner.load()
        await h.transport.enqueue("/api/v1/invitations", data: try page(ids: [first, second]))
        await owner.load(more: true)
        #expect(owner.items.map(\.id) == [first, second])
        await h.transport.enqueue(
            "/api/v1/invitations", data: try page(ids: [second], cursor: "fresh"))
        await h.transport.enqueue("/api/v1/invitations", data: try page(ids: [first]))
        await owner.load()
        #expect(owner.items.map(\.id) == [second, first])
        #expect(owner.page.error == nil)
    }

    @Test func refreshFailureRetainsCardsAndServerResponseRemovesThem() async throws {
        let h = try SessionHarness()
        try await h.login()
        let owner = SavedInvitationsOwner(session: h.session)
        let id = UUID()
        await h.transport.enqueue("/api/v1/invitations", data: try page(ids: [id]))
        await owner.load()
        await h.transport.enqueue("/api/v1/invitations", status: 503)
        await owner.load()
        #expect(owner.items.map(\.id) == [id] && owner.page.error != nil)
        await h.transport.enqueue("/api/v1/invitations", data: try page(ids: []))
        await owner.load()
        #expect(owner.items.isEmpty && owner.page.error == nil)
    }

    @Test func logoutRejectsLateResponseAndCancellationAllowsRetry() async throws {
        let h = try SessionHarness()
        try await h.login()
        let owner = SavedInvitationsOwner(session: h.session)
        let gate = TestGate()
        await h.transport.enqueue("/api/v1/invitations", data: try page(ids: [UUID()]), gate: gate)
        let pending = Task { await owner.load() }
        try await h.transport.waitFor("/api/v1/invitations")
        pending.cancel()
        await gate.release()
        await pending.value
        #expect(!owner.page.isLoading && owner.page.error == nil)
        let late = TestGate()
        await h.transport.enqueue("/api/v1/invitations", data: try page(ids: [UUID()]), gate: late)
        let old = Task { await owner.load() }
        try await h.transport.waitFor("/api/v1/invitations", count: 2)
        await h.transport.enqueue("/api/v1/auth/logout", status: 204)
        try await h.session.logout()
        await late.release()
        await old.value
        #expect(owner.items.isEmpty && owner.page.value == nil)
    }

    @Test func unexpectedAnswerCannotBecomeSavedInvitation() async throws {
        let h = try SessionHarness()
        try await h.login()
        let owner = SavedInvitationsOwner(session: h.session)
        await h.transport.enqueue(
            "/api/v1/invitations", data: try page(ids: [UUID()], answer: "going"))
        await owner.load()
        #expect(owner.items.isEmpty && owner.page.error == .invalidResponse)
    }
}
