import Foundation
import Testing

@testable import Somewhere

@MainActor
struct PlacePollTests {
    private func fixture(_ updates: [String: JSONValue] = [:]) throws -> PlacePoll {
        var body = try APICoding.decode(
            [String: JSONValue].self, from: Fixtures.data("place-poll-open"))
        body["closes_at"] = .string(Date().addingTimeInterval(3600).ISO8601Format())
        body.merge(updates) { _, new in new }
        return try APICoding.decode(PlacePoll.self, from: APICoding.encode(body))
    }

    @Test func failedVotePreservesAnswerAndExactRetry() async throws {
        let poll = try fixture()
        let h = try SessionHarness()
        try await h.login()
        let owner = PlacePollOwner(meetingID: poll.meetingID, session: h.session)
        let path =
            "/api/v1/" + PlacePollRequests.path(poll.meetingID, poll.id).joined(separator: "/")
        await h.transport.enqueue(path, data: try APICoding.encode(poll))
        await owner.load(poll.id)
        await h.transport.enqueue(path + "/vote", status: 503)
        await owner.vote("against")
        #expect(owner.poll?.myVote == "for" && owner.pending != nil && !owner.editable)
        let saved = try fixture(["my_vote": .string("against"), "my_vote_revision": .string("2")])
        await h.transport.enqueue(path + "/vote", data: try APICoding.encode(saved))
        await h.transport.enqueue(
            "/api/v1/meetings/\(poll.meetingID.uuidString.lowercased())",
            data: try APICoding.encode(Fixtures.meeting(poll.meetingID)))
        await h.transport.enqueue(
            "/api/v1/meetings",
            data: try APICoding.encode(MeetingsPage(meetings: [], nextCursor: nil)))
        await owner.retry()
        let sent = await h.transport.requests.filter { $0.httpMethod == "PUT" }
        #expect(sent.count == 2 && sent.first?.httpBody == sent.last?.httpBody)
        #expect(
            sent.first?.value(forHTTPHeaderField: "Idempotency-Key")
                == sent.last?.value(forHTTPHeaderField: "Idempotency-Key"))
        #expect(owner.pending == nil && owner.poll?.myVote == "against")
    }

    @Test func conflictReadsCurrentAndClosedPollRejectsVote() async throws {
        let poll = try fixture()
        let h = try SessionHarness()
        try await h.login()
        let owner = PlacePollOwner(meetingID: poll.meetingID, session: h.session)
        let path =
            "/api/v1/" + PlacePollRequests.path(poll.meetingID, poll.id).joined(separator: "/")
        await h.transport.enqueue(path, data: try APICoding.encode(poll))
        await owner.load(poll.id)
        let closed = try fixture(["state": .string("cancelled"), "can_vote": .bool(false)])
        await h.transport.enqueue(path + "/vote", status: 409)
        await h.transport.enqueue(path, data: try APICoding.encode(closed))
        await owner.vote("against")
        #expect(owner.poll?.state == "cancelled" && owner.pending == nil && owner.problem != nil)
        let before = await h.transport.requests.count
        await owner.vote("for")
        #expect(await h.transport.requests.count == before)
        #expect(PlacePollCopy.status(closed, timezone: "UTC").contains("отменён"))
    }

    @Test func lostMembershipRejectsLateReadAndFailureKeepsCard() async throws {
        let poll = try fixture()
        let h = try SessionHarness()
        try await h.login()
        let owner = PlacePollOwner(meetingID: poll.meetingID, session: h.session)
        let path =
            "/api/v1/" + PlacePollRequests.path(poll.meetingID, poll.id).joined(separator: "/")
        await h.transport.enqueue(path, data: try APICoding.encode(poll))
        await owner.load(poll.id)
        await h.transport.enqueue(path, status: 503)
        await owner.load(poll.id)
        #expect(owner.poll == poll && owner.problem != nil)
        let gate = TestGate()
        await h.transport.enqueue(path, data: try APICoding.encode(poll), gate: gate)
        let read = Task { await owner.load(poll.id) }
        try await h.transport.waitFor(path, count: 3)
        h.session.updateMeetingAccess(poll.meetingID, allowed: false)
        await gate.release()
        await read.value
        #expect(!owner.current)
        owner.clear()
        #expect(owner.poll == nil && owner.pending == nil)
    }

    @Test func createRequestAndDeadlineStates() throws {
        let poll = try fixture(["closes_at": .string("2020-01-01T00:00:00Z")])
        #expect(PlacePollCopy.status(poll, timezone: "UTC") == "Голосование завершено")
        let request = try PlacePollRequests.create(
            poll.meetingID, place: "У Саши", deadline: Date())
        let body = try APICoding.decode([String: JSONValue].self, from: #require(request.body))
        #expect(body["place"] == .string("У Саши"))
        #expect(request.expectedStatus == 201)
    }
}
