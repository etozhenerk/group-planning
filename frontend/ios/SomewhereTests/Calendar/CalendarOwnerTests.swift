import Foundation
import Testing

@testable import Somewhere

@MainActor
struct CalendarOwnerTests {
    @Test func metadataAndDelayedFilterKeepOneEmptyAction() async throws {
        let h = try SessionHarness()
        try await h.login()
        let owner = MeetingListOwner(session: h.session)
        await h.transport.enqueue("/api/v1/meetings", data: try CalendarFixtures.page())
        await owner.load()
        #expect(owner.empty)
        owner.select(period: .past)
        #expect(owner.empty)
        let gate = TestGate()
        await h.transport.enqueue(
            "/api/v1/meetings", data: try CalendarFixtures.page(period: "past"), gate: gate)
        let pending = Task { await owner.load() }
        try await h.transport.waitFor("/api/v1/meetings", count: 2)
        #expect(owner.empty && owner.page.isLoading)
        await gate.release()
        await pending.value
        #expect(owner.empty)
    }

    @Test func oldPeriodCannotReplaceNewData() async throws {
        let h = try SessionHarness()
        try await h.login()
        let owner = MeetingListOwner(session: h.session)
        let gate = TestGate()
        let old = UUID()
        let current = UUID()
        await h.transport.enqueue(
            "/api/v1/meetings", data: try CalendarFixtures.page(ids: [old]), gate: gate)
        let pending = Task { await owner.load() }
        try await h.transport.waitFor("/api/v1/meetings")
        owner.select(period: .past)
        await h.transport.enqueue(
            "/api/v1/meetings", data: try CalendarFixtures.page(ids: [current], period: "past"))
        await owner.load()
        await gate.release()
        await pending.value
        #expect(owner.items.map(\.id) == [current])
        #expect(owner.counts?.past == 1)
    }

    @Test func paginationConflictRestartsAndKeepsSelection() async throws {
        let h = try SessionHarness()
        try await h.login()
        let owner = MeetingListOwner(session: h.session)
        let first = UUID()
        let second = UUID()
        await h.transport.enqueue(
            "/api/v1/meetings",
            data: try CalendarFixtures.page(ids: [first], total: 52, cursor: "next"))
        await owner.load()
        #expect(owner.counts?.upcoming == 52)
        await h.transport.enqueue(
            "/api/v1/meetings", data: try CalendarFixtures.page(ids: [second], total: 52))
        await owner.fetchMore()
        #expect(owner.items.map(\.id) == [first, second])
        await h.transport.enqueue(
            "/api/v1/meetings",
            data: try CalendarFixtures.page(ids: [first], total: 52, cursor: "next"))
        await owner.load(resetPages: true)
        let conflict = APIErrorEnvelope(
            error: APIProblem(
                code: "calendar_changed", fieldErrors: [:], requestID: UUID(), currentResponse: nil,
                currentMeeting: nil))
        await h.transport.enqueue(
            "/api/v1/meetings", data: try APICoding.encode(conflict), status: 409)
        await h.transport.enqueue(
            "/api/v1/meetings", data: try CalendarFixtures.page(ids: [second]))
        await owner.fetchMore()
        #expect(owner.items.map(\.id) == [second] && owner.selection.period == .upcoming)
        #expect(owner.loadedPages == 1 && !owner.loadingMore)
    }

    @Test func monthMetadataAndMeetingZoneSurviveRefreshFailure() async throws {
        let h = try SessionHarness()
        try await h.login()
        let owner = MeetingListOwner(session: h.session)
        owner.select(display: .calendar)
        owner.select(day: "2026-10-24")
        let id = UUID()
        let wire = try CalendarFixtures.page(ids: [id], total: 2)
        await h.transport.enqueue("/api/v1/meetings", data: wire)
        await h.transport.enqueue("/api/v1/meetings", data: wire)
        await owner.load()
        #expect(owner.dayCount == 2 && owner.items.first?.localDate == "2026-10-24")
        await h.transport.enqueue("/api/v1/meetings", status: 503)
        await h.transport.enqueue("/api/v1/meetings", status: 503)
        await owner.load()
        #expect(owner.items.map(\.id) == [id] && owner.page.error != nil)
        #expect(owner.selection.day == "2026-10-24")
    }

    @Test func persistedStatusChangesOnlyOnResponseAndLogoutRejectsLateData() async throws {
        let h = try SessionHarness()
        try await h.login()
        let owner = MeetingListOwner(session: h.session)
        let id = UUID()
        await h.transport.enqueue(
            "/api/v1/meetings",
            data: try CalendarFixtures.page(ids: [id], transition: "2020-01-01T00:00:00Z"))
        await owner.load()
        #expect(owner.items.first?.period == .upcoming)
        await h.transport.enqueue("/api/v1/meetings", data: try CalendarFixtures.page())
        await owner.load()
        #expect(owner.items.isEmpty)
        let gate = TestGate()
        await h.transport.enqueue(
            "/api/v1/meetings", data: try CalendarFixtures.page(ids: [id]), gate: gate)
        let pending = Task { await owner.load() }
        try await h.transport.waitFor("/api/v1/meetings", count: 3)
        try? await h.session.logout()
        await gate.release()
        await pending.value
        #expect(owner.items.isEmpty)
    }
}
