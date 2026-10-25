import Foundation
import Testing

@testable import Somewhere

@Suite("Feedback privacy and retry")
@MainActor
struct SupportExperienceTests {
    @Test func validationAndRateLimitKeepFieldsWithoutSuccess() async throws {
        let harness = try SessionHarness()
        let owner = SupportOwner(api: harness.session.api, kind: .problem, screen: "profile")
        owner.description = "Не получается загрузить свой профиль"
        owner.email = "sasha@example.com"
        let path = "/api/v1/support/feedback"
        await harness.transport.enqueue(
            path,
            data: Data(
                """
                {"error":{"code":"validation_failed","field_errors":{"email":"invalid"},"request_id":"00000000-0000-4000-8000-000000000001"}}
                """.utf8), status: 422)
        await owner.submit()
        #expect(owner.fieldErrors["email"] == "invalid")
        #expect(owner.reference == nil)
        #expect(owner.email == "sasha@example.com")
        await harness.transport.enqueue(path, status: 429)
        await owner.submit()
        #expect(owner.reference == nil)
        #expect(owner.problem?.contains("позже") == true)
        #expect(owner.description == "Не получается загрузить свой профиль")
    }
    @Test func lostResponseRetainsDraftAndIdempotencyWithoutPrivateDiagnostics() async throws {
        let harness = try SessionHarness()
        try await harness.login()
        let owner = SupportOwner(api: harness.session.api, kind: .problem, screen: "meeting_chat")
        owner.description = "Не открывается фотография встречи"
        let path = "/api/v1/support/feedback"
        await harness.transport.enqueue(path, status: 503)
        await owner.submit()
        #expect(owner.reference == nil)
        #expect(owner.problem != nil)
        #expect(!owner.description.isEmpty)
        await harness.transport.enqueue(
            path,
            data: Data(
                "{\"id\":\"\(UUID())\",\"reference\":\"SW-123\",\"status\":\"accepted\"}".utf8),
            status: 201)
        await owner.submit()
        #expect(owner.reference == "SW-123")
        let requests = await harness.transport.requests.filter { $0.url?.path == path }
        #expect(requests.count == 2)
        #expect(requests[0].httpBody == requests[1].httpBody)
        #expect(
            requests[0].value(forHTTPHeaderField: "Idempotency-Key")
                == requests[1].value(forHTTPHeaderField: "Idempotency-Key"))
        #expect(requests[0].value(forHTTPHeaderField: "Authorization") == nil)
        let body = try #require(requests[0].httpBody)
        let object = try #require(JSONSerialization.jsonObject(with: body) as? [String: Any])
        #expect(object["diagnostics"] == nil)
        #expect(object["email"] == nil)
        #expect(object["screenshot"] == nil)
        #expect(object["description"] as? String == owner.description)
        #expect(
            object["client_request_id"] as? String
                == requests[0].value(forHTTPHeaderField: "Idempotency-Key"))
    }
    @Test func cancelledFeedbackCannotPresentDelayedReceipt() async throws {
        let harness = try SessionHarness()
        let owner = SupportOwner(api: harness.session.api, kind: .idea, screen: "profile")
        owner.description = "Добавить ещё один вариант встречи"
        let gate = TestGate()
        let path = "/api/v1/support/feedback"
        await harness.transport.enqueue(
            path,
            data: Data(
                "{\"id\":\"\(UUID())\",\"reference\":\"SW-124\",\"status\":\"accepted\"}".utf8),
            status: 201, gate: gate)
        let work = Task { await owner.submit() }
        try await harness.transport.waitFor(path)
        owner.cancel()
        await gate.release()
        await work.value
        #expect(owner.reference == nil)
    }
}
