import Foundation
import Testing

@testable import Somewhere

@MainActor
struct CalendarSelectionTests {
    @Test func periodLeavesUndatedAndCalendarStartsFromDatedMeetings() async throws {
        let h = try SessionHarness()
        try await h.login()
        let owner = MeetingListOwner(session: h.session)
        owner.toggleUndated()
        await h.transport.enqueue(
            "/api/v1/meetings",
            data: try CalendarFixtures.page(ids: [UUID()], day: nil, period: "undated"))
        await owner.load()
        owner.select(display: .calendar)
        #expect(owner.selection.selected[.upcoming] == nil)
        owner.select(period: .upcoming)
        #expect(!owner.selection.undated)
        let wire = try CalendarFixtures.page(ids: [UUID()], day: "2026-10-31")
        for _ in 0..<3 { await h.transport.enqueue("/api/v1/meetings", data: wire) }
        await owner.load()
        #expect(owner.selection.day == "2026-10-31")
    }

    @Test func dayPaginationRestartsWithoutChangingDayOrCombiningSnapshots() async throws {
        let h = try SessionHarness()
        try await h.login()
        let owner = MeetingListOwner(session: h.session)
        owner.select(display: .calendar)
        owner.select(day: "2026-10-24")
        let old = UUID()
        let current = UUID()
        let initial = try CalendarFixtures.page(ids: [old], total: 51, cursor: "next")
        for _ in 0..<2 { await h.transport.enqueue("/api/v1/meetings", data: initial) }
        await owner.load()
        let conflict = APIErrorEnvelope(
            error: APIProblem(
                code: "calendar_changed", fieldErrors: [:], requestID: UUID(), currentResponse: nil,
                currentMeeting: nil))
        await h.transport.enqueue(
            "/api/v1/meetings", data: try APICoding.encode(conflict), status: 409)
        let refreshed = try CalendarFixtures.page(ids: [current])
        for _ in 0..<2 { await h.transport.enqueue("/api/v1/meetings", data: refreshed) }
        await owner.fetchMore()
        #expect(owner.items.map(\.id) == [current])
        #expect(owner.selection.day == "2026-10-24" && owner.loadedPages == 1)
        let requests = await h.transport.requests
        let url = try #require(requests.last?.url)
        let query = try #require(
            URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems)
        #expect(query.contains(URLQueryItem(name: "from", value: "2026-10-24")))
        #expect(query.contains(URLQueryItem(name: "to", value: "2026-10-25")))
        #expect(!query.contains { $0.name == "cursor" })
    }
}
