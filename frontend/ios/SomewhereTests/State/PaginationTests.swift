import Foundation
import Testing

@testable import Somewhere

@MainActor
struct PaginationTests {
    private func summary(_ id: UUID, title: String) throws -> MeetingSummary {
        try APICoding.decode(
            MeetingSummary.self, from: APICoding.encode(Fixtures.meeting(id, title: title)))
    }
    @Test func moreFailureKeepsItemsAndRetryMergesWithoutDuplicates() async throws {
        let harness = try SessionHarness()
        try await harness.login()
        let first = try summary(UUID(), title: "Первая")
        let second = try summary(UUID(), title: "Вторая")
        let repository = MeetingRepository(session: harness.session)
        await harness.transport.enqueue(
            "/api/v1/meetings",
            data: try APICoding.encode(MeetingsPage(meetings: [first], nextCursor: "next")))
        await repository.loadMeetings()
        await harness.transport.enqueue("/api/v1/meetings", status: 503)
        await repository.loadMoreMeetings()
        #expect(harness.session.privateData.meetings.value == [first])
        #expect(harness.session.privateData.moreError != nil)
        await harness.transport.enqueue(
            "/api/v1/meetings",
            data: try APICoding.encode(MeetingsPage(meetings: [first, second], nextCursor: nil)))
        await repository.loadMoreMeetings()
        #expect(harness.session.privateData.meetings.value == [first, second])
        #expect(harness.session.privateData.meetingsCursor == nil)
        #expect(harness.session.privateData.moreError == nil)
        let last = await harness.transport.requests.last
        #expect(last?.url?.query == "cursor=next")
    }
    @Test func refreshedListRejectsLatePage() async throws {
        let harness = try SessionHarness()
        try await harness.login()
        let first = try summary(UUID(), title: "Первая")
        let stale = try summary(UUID(), title: "Старая страница")
        let repository = MeetingRepository(session: harness.session)
        await harness.transport.enqueue(
            "/api/v1/meetings",
            data: try APICoding.encode(MeetingsPage(meetings: [first], nextCursor: "next")))
        await repository.loadMeetings()
        let gate = TestGate()
        await harness.transport.enqueue(
            "/api/v1/meetings",
            data: try APICoding.encode(MeetingsPage(meetings: [stale], nextCursor: nil)), gate: gate
        )
        let more = Task { await repository.loadMoreMeetings() }
        try await harness.transport.waitFor("/api/v1/meetings", count: 2)
        await harness.transport.enqueue(
            "/api/v1/meetings",
            data: try APICoding.encode(MeetingsPage(meetings: [], nextCursor: nil)))
        await repository.loadMeetings()
        await gate.release()
        await more.value
        #expect(harness.session.privateData.meetings.value == [])
        #expect(!harness.session.privateData.loadingMore)
    }
}
