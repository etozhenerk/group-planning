import Foundation
import Testing

@testable import Somewhere

@MainActor
struct PreparationTaskTests {
    private func fixture(_ updates: [String: JSONValue] = [:]) throws -> PreparationTask {
        var body = try APICoding.decode(
            [String: JSONValue].self, from: Fixtures.data("preparation-task-offered"))
        body["can_accept"] = .bool(true)
        body.merge(updates) { _, new in new }
        return try APICoding.decode(PreparationTask.self, from: APICoding.encode(body))
    }

    private func path(_ task: PreparationTask) -> String {
        "/api/v1/" + PreparationTaskRequests.path(task.meetingID, task.id).joined(separator: "/")
    }

    @Test func unconfirmedAcceptanceRetainsOfferedStateAndExactRetry() async throws {
        let task = try fixture()
        let h = try SessionHarness()
        try await h.login()
        let owner = PreparationTaskOwner(meetingID: task.meetingID, session: h.session)
        await h.transport.enqueue(path(task), data: try APICoding.encode(task))
        await owner.load(task.id)
        await h.transport.enqueue(path(task) + "/accept", status: 503)
        await owner.act(.accept)
        #expect(owner.task == task && owner.task?.assignee == nil && owner.pending != nil)
        #expect(!owner.editable)
        let accepted = try fixture(["state": .string("accepted"), "can_accept": .bool(false)])
        await h.transport.enqueue(path(task) + "/accept", data: try APICoding.encode(accepted))
        await owner.retry()
        let requests = await h.transport.requests.filter { $0.httpMethod == "POST" }
        #expect(requests.count == 2 && requests.first?.httpBody == requests.last?.httpBody)
        #expect(
            requests.first?.value(forHTTPHeaderField: "Idempotency-Key")
                == requests.last?.value(forHTTPHeaderField: "Idempotency-Key"))
        #expect(owner.task?.state == "accepted" && owner.pending == nil)
    }

    @Test func conflictLoadsCurrentTaskAndPreventsAnotherAcceptance() async throws {
        let task = try fixture()
        let h = try SessionHarness()
        try await h.login()
        let owner = PreparationTaskOwner(meetingID: task.meetingID, session: h.session)
        await h.transport.enqueue(path(task), data: try APICoding.encode(task))
        await owner.load(task.id)
        let accepted = try fixture(["state": .string("accepted"), "can_accept": .bool(false)])
        await h.transport.enqueue(path(task) + "/accept", status: 409)
        await h.transport.enqueue(path(task), data: try APICoding.encode(accepted))
        await owner.act(.accept)
        #expect(owner.task == accepted && owner.pending == nil && owner.problem != nil)
        let count = await h.transport.requests.count
        await owner.act(.accept)
        #expect(await h.transport.requests.count == count)
    }

    @Test func readFailureKeepsCardAndRevocationRejectsLateMutation() async throws {
        let task = try fixture()
        let h = try SessionHarness()
        try await h.login()
        let owner = PreparationTaskOwner(meetingID: task.meetingID, session: h.session)
        await h.transport.enqueue(path(task), data: try APICoding.encode(task))
        await owner.load(task.id)
        await h.transport.enqueue(path(task), status: 503)
        await owner.load(task.id)
        #expect(owner.task == task && owner.problem != nil)
        let gate = TestGate()
        await h.transport.enqueue(
            path(task) + "/accept", data: try APICoding.encode(task), gate: gate)
        let write = Task { await owner.act(.accept) }
        try await h.transport.waitFor(path(task) + "/accept", count: 1)
        h.session.updateMeetingAccess(task.meetingID, allowed: false)
        await gate.release()
        await write.value
        #expect(!owner.current)
        owner.clear()
        #expect(owner.task == nil && owner.pending == nil)
    }

    @Test func creationRequiresValidDraftAndEncodesGeneralRecipientExplicitly() async throws {
        let task = try fixture()
        let h = try SessionHarness()
        try await h.login()
        let form = PreparationFormOwner(meetingID: task.meetingID, session: h.session)
        form.participants = []
        await form.submit()
        #expect(form.operation.problem != nil)
        form.title = "Заказать пиццу"
        form.recipient = UUID()
        await form.submit()
        #expect(form.operation.problem == "Выберите участника из списка.")
        #expect(await h.transport.requests.allSatisfy { $0.httpMethod != "POST" })
        let request = try PreparationTaskRequests.create(
            task.meetingID, title: form.title, recipient: nil)
        let body = try APICoding.decode([String: JSONValue].self, from: #require(request.body))
        #expect(body["recipient_id"] == .null && request.expectedStatus == 201)
        #expect(request.meetingID == task.meetingID)
    }

    @Test func participantsRetryRetainsDraftAndWrongTaskReplyIsNotApplied() async throws {
        let task = try fixture()
        let h = try SessionHarness()
        try await h.login()
        let form = PreparationFormOwner(meetingID: task.meetingID, session: h.session)
        form.title = "Заказать пиццу"
        let people = "/api/v1/meetings/\(task.meetingID.uuidString.lowercased())/participants"
        await h.transport.enqueue(people, status: 503)
        await form.loadParticipants()
        #expect(form.peopleProblem != nil && form.title == "Заказать пиццу")
        await h.transport.enqueue(people, data: Data("{\"participants\":[]}".utf8))
        await form.loadParticipants()
        #expect(form.peopleProblem == nil && form.participants?.isEmpty == true)
        let owner = form.operation
        await h.transport.enqueue(path(task), data: try APICoding.encode(task))
        await owner.load(task.id)
        let wrong = try fixture(["id": .string(UUID().uuidString.lowercased())])
        await h.transport.enqueue(path(task) + "/accept", data: try APICoding.encode(wrong))
        await owner.act(.accept)
        #expect(owner.task == task && owner.pending != nil)
    }
}
