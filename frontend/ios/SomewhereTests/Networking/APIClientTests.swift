import Foundation
import Testing

@testable import Somewhere

@Suite("HTTP requests and API errors")
struct APIClientTests {
    @Test func requestUsesBearerAndMatchingMessageKey() async throws {
        let transport = TestTransport()
        let url = try #require(URL(string: "https://api.example.test"))
        let api = try APIClient(origin: APIOrigin(url), transport: transport)
        let id = UUID()
        let key = UUID()
        let path = "/api/v1/meetings/" + id.uuidString.lowercased() + "/messages"
        await transport.enqueue(path, data: try Fixtures.data("late-message-retry"), status: 201)
        let credential = try StoredSession(token: "test-token", expiresAt: .distantFuture)
        _ = try await api.send(
            FeedRequests.message(id, text: "Привет!", clientRequestID: key),
            as: FeedEntry.self, credential: credential)
        let request = try #require(await transport.requests.first)
        #expect(request.httpMethod == "POST")
        #expect(request.value(forHTTPHeaderField: "Authorization") == "Bearer test-token")
        #expect(request.value(forHTTPHeaderField: "Idempotency-Key") == key.uuidString.lowercased())
        #expect(request.value(forHTTPHeaderField: "X-CSRF-Token") == nil)
        #expect(request.value(forHTTPHeaderField: "Cookie") == nil)
        let body = try #require(request.httpBody)
        let object = try #require(JSONSerialization.jsonObject(with: body) as? [String: String])
        #expect(object["client_request_id"] == key.uuidString.lowercased())
        #expect(request.url?.query == nil)
    }

    @Test func statusSurvivesMalformedErrorBody() async throws {
        let transport = TestTransport()
        let api = try APIClient(
            origin: APIOrigin(#require(URL(string: "https://api.example.test"))),
            transport: transport)
        await transport.enqueue(
            "/api/v1/me", data: Data("not json".utf8), status: 401, mime: "text/plain")
        do {
            _ = try await api.send(SessionRequests.me, as: CurrentSession.self)
            Issue.record("401 must fail")
        } catch { #expect((error as? ClientFailure)?.statusCode == 401) }
    }

    @Test func successfulWrongMimeOrDataFailsValidation() async throws {
        let transport = TestTransport()
        let api = try APIClient(
            origin: APIOrigin(#require(URL(string: "https://api.example.test"))),
            transport: transport)
        await transport.enqueue("/api/v1/me", data: try Fixtures.me(), mime: "text/html")
        await #expect(throws: ClientFailure.invalidResponse) {
            try await api.send(SessionRequests.me, as: CurrentSession.self)
        }
        await transport.enqueue("/api/v1/me", data: Data("{}".utf8))
        await #expect(throws: ClientFailure.invalidResponse) {
            try await api.send(SessionRequests.me, as: CurrentSession.self)
        }
    }

    @Test func originAndPathCannotChangeDestination() throws {
        for text in [
            "http://api.example.test", "https://user:pass@api.example.test",
            "https://api.example.test/a", "https://api.example.test?q=1",
            "https://api.example.test/#x",
        ] {
            #expect(throws: ClientFailure.invalidOrigin) {
                try APIOrigin(#require(URL(string: text)))
            }
        }
        let origin = try APIOrigin(#require(URL(string: "https://api.example.test/")))
        #expect(throws: ClientFailure.invalidRequest) {
            try origin.url(for: APIRequest(path: ["..", "me"]))
        }
        #expect(throws: ClientFailure.invalidRequest) {
            try origin.url(for: APIRequest(path: ["https://evil.test"]))
        }
        let request = MeetingRequests.list(cursor: "x&secret=value#part")
        let url = try origin.url(for: request)
        #expect(url.host == "api.example.test")
        #expect(URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems?.count == 1)
    }

    @Test func mobileAttemptAndFeedCursorsUseCanonicalWireValues() throws {
        let id = UUID()
        let exchange = MobileExchange(
            attemptID: id, handoffCode: "handoff", appVerifier: String(repeating: "v", count: 43))
        let body = try #require(
            JSONSerialization.jsonObject(with: APICoding.encode(exchange)) as? [String: String])
        #expect(body["attempt_id"] == id.uuidString.lowercased())
        let counter = try ServerCounter("9007199254740993")
        let request = try FeedRequests.page(id, after: counter)
        #expect(request.query.first { $0.name == "after_sequence" }?.value == counter.rawValue)
        #expect(throws: ClientFailure.invalidRequest) {
            try FeedRequests.page(id, after: .zero, before: .zero)
        }
        #expect(throws: ClientFailure.invalidRequest) { try FeedRequests.page(id, limit: 101) }
    }

    @Test func credentialsRejectHeaderInjectionAndRedactDebugging() throws {
        #expect(throws: ClientFailure.invalidStoredSession) {
            try StoredSession(token: "token\r\nX-Header: value", expiresAt: .distantFuture)
        }
        let credential = try StoredSession(token: "private-token", expiresAt: .distantFuture)
        #expect(!String(reflecting: credential).contains("private-token"))
    }
}
