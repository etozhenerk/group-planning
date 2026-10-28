import Foundation
import Security
import XCTest

// A second account in the disposable API fixture; never used by either application target.
@MainActor
final class NativeChatCounterpart {
    private struct Config: Decodable {
        struct Credential: Decodable { let token: String }
        let origin: URL
        let certificate: Data
        let cases: [String: Credential]
    }
    private let config: Config
    private let session: URLSession
    private let token: String
    private let meeting = ChatSheetTestSupport.sharedMeeting
    private var joinedRevision: String?

    init() throws {
        let path = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
            .deletingLastPathComponent().appendingPathComponent(".build/chat-fixture-control.json")
        config = try JSONDecoder().decode(Config.self, from: Data(contentsOf: path))
        guard config.origin.scheme == "https", config.origin.host == "127.0.0.1",
            config.origin.port != nil, let token = config.cases["feed-owner"]?.token
        else { throw URLError(.badURL) }
        self.token = token
        let settings = URLSessionConfiguration.ephemeral
        settings.httpShouldSetCookies = false
        settings.httpCookieStorage = nil
        settings.urlCache = nil
        settings.timeoutIntervalForRequest = 10
        session = URLSession(
            configuration: settings,
            delegate: NativeChatCounterpartTrust(
                origin: config.origin, certificate: config.certificate),
            delegateQueue: nil)
    }
    deinit { session.invalidateAndCancel() }

    func join() async throws {
        let invitation = Data("0000000000009501".utf8).base64EncodedString()
            .replacingOccurrences(of: "=", with: "")
        let result = try await request(
            "invitations/" + invitation + "/rsvp", method: "PUT",
            body: ["answer": "going", "expected_revision": "0"])
        joinedRevision = try XCTUnwrap(result["rsvp_revision"] as? String)
    }

    func leave() async throws {
        guard let revision = joinedRevision else { return }
        let result = try await request(
            "meetings/" + meeting + "/rsvp", method: "PUT",
            body: ["answer": "not_going", "expected_revision": revision])
        XCTAssertEqual(result["rsvp"] as? String, "not_going")
        XCTAssertEqual(result["can_access_feed"] as? Bool, false)
        joinedRevision = nil
    }

    func read(_ text: String) async throws {
        let page = try await request("meetings/" + meeting + "/sync")
        let entries = try XCTUnwrap(page["entries"] as? [[String: Any]])
        let entry = try XCTUnwrap(
            entries.first { ($0["payload"] as? [String: Any])?["text"] as? String == text })
        let sequence = try XCTUnwrap(entry["sequence"] as? String)
        _ = try await request(
            "meetings/" + meeting + "/read-marker", method: "PUT",
            body: ["read_through_sequence": sequence])
    }

    func send(_ text: String) async throws -> String {
        let key = UUID().uuidString.lowercased()
        let result = try await request(
            "meetings/" + meeting + "/messages", method: "POST",
            body: ["text": text, "client_request_id": key], key: key)
        return try XCTUnwrap(result["id"] as? String)
    }

    func waitForReader(of entry: String) async throws {
        for _ in 0..<30 {
            let result = try await request(
                "meetings/" + meeting + "/read-receipts/query", method: "POST",
                body: ["entry_ids": [entry]])
            let receipts = result["receipts"] as? [[String: Any]]
            if receipts?.first?["reader_count"] as? String == "1" { return }
            try await Task.sleep(for: .milliseconds(200))
        }
        XCTFail("The native visible message end must advance its confirmed read marker")
    }

    private func request(
        _ path: String, method: String = "GET", body: [String: Any]? = nil,
        key: String = UUID().uuidString.lowercased()
    ) async throws -> [String: Any] {
        var request = URLRequest(url: config.origin.appendingPathComponent("api/v1/" + path))
        request.httpMethod = method
        request.setValue("Bearer " + token, forHTTPHeaderField: "Authorization")
        request.setValue("chat-counterpart", forHTTPHeaderField: "X-Somewhere-Test-Scenario")
        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.setValue(key, forHTTPHeaderField: "Idempotency-Key")
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        }
        let (data, response) = try await session.data(for: request)
        let status = try XCTUnwrap(response as? HTTPURLResponse).statusCode
        guard (200..<300).contains(status) else {
            throw NSError(domain: "ChatFixtureHTTP", code: status)
        }
        return try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
    }
}

private final class NativeChatCounterpartTrust: NSObject, URLSessionDelegate {
    let origin: URL
    let certificate: Data
    init(origin: URL, certificate: Data) {
        self.origin = origin
        self.certificate = certificate
    }
    func urlSession(
        _ session: URLSession, didReceive challenge: URLAuthenticationChallenge,
        completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
    ) {
        let space = challenge.protectionSpace
        guard space.authenticationMethod == NSURLAuthenticationMethodServerTrust,
            space.host == origin.host, space.port == origin.port, let trust = space.serverTrust,
            let anchor = SecCertificateCreateWithData(nil, certificate as CFData),
            SecTrustSetAnchorCertificates(trust, [anchor] as CFArray) == errSecSuccess,
            SecTrustSetAnchorCertificatesOnly(trust, true) == errSecSuccess,
            SecTrustEvaluateWithError(trust, nil)
        else {
            completionHandler(.cancelAuthenticationChallenge, nil)
            return
        }
        completionHandler(.useCredential, URLCredential(trust: trust))
    }
}
