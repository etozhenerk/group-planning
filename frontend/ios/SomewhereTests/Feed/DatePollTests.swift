import Foundation
import Testing

@testable import Somewhere

@MainActor
struct DatePollTests {
    private func fixture(_ updates: [String: JSONValue] = [:]) throws -> DatePoll {
        let data = try Fixtures.data("date-poll-hidden")
        var body = try APICoding.decode([String: JSONValue].self, from: data)
        body.merge(updates) { _, new in new }
        return try APICoding.decode(DatePoll.self, from: APICoding.encode(body))
    }

    @Test func uncertainVoteRetriesExactlyAndKeepsHiddenResultsPrivate() async throws {
        let poll = try fixture()
        let h = try SessionHarness()
        try await h.login()
        let owner = DatePollOwner(meetingID: poll.meetingID, session: h.session)
        let path =
            "/api/v1/meetings/\(poll.meetingID.uuidString.lowercased())/date-polls/\(poll.id.uuidString.lowercased())"
        await h.transport.enqueue(path, data: try APICoding.encode(poll))
        await owner.load(poll.id)
        let chosen = try #require(poll.options.last?.id)
        owner.choose(chosen)
        let selection = owner.selection
        await h.transport.enqueue(path + "/vote", status: 503)
        await owner.vote()
        #expect(owner.pending != nil && !owner.editable)
        owner.choose(chosen)
        #expect(owner.selection == selection)
        let saved = try fixture(["my_option_ids": .array(selection.map { .string($0.uuidString) })])
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
        #expect(owner.pending == nil && owner.selection == selection)
        #expect(owner.poll?.options.allSatisfy { $0.votes == nil && $0.voters == nil } == true)
    }

    @Test func conflictRefreshKeepsSelectionAndClosedPollDisablesChanges() async throws {
        let poll = try fixture()
        let h = try SessionHarness()
        try await h.login()
        let owner = DatePollOwner(meetingID: poll.meetingID, session: h.session)
        let path =
            "/api/v1/meetings/\(poll.meetingID.uuidString.lowercased())/date-polls/\(poll.id.uuidString.lowercased())"
        await h.transport.enqueue(path, data: try APICoding.encode(poll))
        await owner.load(poll.id)
        let chosen = try #require(poll.options.last?.id)
        owner.choose(chosen)
        let selection = owner.selection
        let closed = try fixture([
            "state": .string("cancelled"), "can_vote": .bool(false),
            "can_add_options": .bool(false),
        ])
        await h.transport.enqueue(path + "/vote", status: 409)
        await h.transport.enqueue(path, data: try APICoding.encode(closed))
        await owner.vote()
        #expect(owner.poll?.state == "cancelled" && owner.pending == nil)
        #expect(owner.selection == selection && owner.problem != nil)
        owner.choose(chosen)
        #expect(owner.selection == selection)
    }

    @Test func revokedAccessRejectsLatePollAndResolveCanExplicitlyClearTime() async throws {
        let poll = try fixture()
        let h = try SessionHarness()
        try await h.login()
        let owner = DatePollOwner(meetingID: poll.meetingID, session: h.session)
        let path =
            "/api/v1/meetings/\(poll.meetingID.uuidString.lowercased())/date-polls/\(poll.id.uuidString.lowercased())"
        let gate = TestGate()
        await h.transport.enqueue(path, data: try APICoding.encode(poll), gate: gate)
        let read = Task { await owner.load(poll.id) }
        try await h.transport.waitFor(path)
        h.session.updateMeetingAccess(poll.meetingID, allowed: false)
        await gate.release()
        await read.value
        #expect(!owner.current && owner.poll == nil)
        let request = try DatePollRequests.action(
            poll, kind: "resolve",
            fields: [
                "option_id": .string(try #require(poll.options.first?.id.uuidString)),
                "starts_at": .null,
            ])
        let body = try APICoding.decode([String: JSONValue].self, from: #require(request.body))
        #expect(
            body["starts_at"] == .null
                && body["expected_revision"] == .string(poll.revision.rawValue))
    }
}
