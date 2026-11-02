import CryptoKit
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
    private let meeting: String
    private var joinedRevision: String?
    private var answerRevision: String?

    init(actor: String = "feed-owner", meeting: String = ChatSheetTestSupport.sharedMeeting) throws
    {
        let path = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
            .deletingLastPathComponent().appendingPathComponent(".build/chat-fixture-control.json")
        config = try JSONDecoder().decode(Config.self, from: Data(contentsOf: path))
        guard config.origin.scheme == "https", config.origin.host == "127.0.0.1",
            config.origin.port != nil, let token = config.cases[actor]?.token
        else { throw URLError(.badURL) }
        self.token = token
        self.meeting = meeting
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

    func reschedule(start: Date?) async throws {
        let detail = try await request("meetings/" + meeting)
        let revision = try XCTUnwrap(detail["revision"] as? String)
        let formatter = ISO8601DateFormatter()
        let timestamp: Any = start.map { formatter.string(from: $0) as Any } ?? NSNull()
        let day = formatter.string(from: start ?? Date().addingTimeInterval(86400)).prefix(10)
        _ = try await request(
            "meetings/" + meeting, method: "PATCH",
            body: [
                "expected_revision": revision, "starts_at": timestamp,
                "starts_on": String(day), "timezone": "UTC",
            ])
    }

    func answer(_ value: String) async throws {
        let revision: String
        if let saved = answerRevision {
            revision = saved
        } else {
            let detail = try await request("meetings/" + meeting)
            revision = try XCTUnwrap(detail["my_rsvp_revision"] as? String)
        }
        let result = try await request(
            "meetings/" + meeting + "/rsvp", method: "PUT",
            body: ["answer": value, "expected_revision": revision])
        XCTAssertEqual(result["rsvp"] as? String, value)
        answerRevision = try XCTUnwrap(result["rsvp_revision"] as? String)
    }

    func join() async throws {
        let invitation = Data("0000000000009501".utf8).base64EncodedString()
            .replacingOccurrences(of: "=", with: "")
        let preview = try await request("invitations/" + invitation)
        let revision = try XCTUnwrap(preview["my_rsvp_revision"] as? String)
        let result = try await request(
            "invitations/" + invitation + "/rsvp", method: "PUT",
            body: ["answer": "going", "expected_revision": revision])
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

    func assertPublishedPDF(fileName: String, sha256: String) async throws {
        let page = try await request("meetings/" + meeting + "/feed")
        let entries = try XCTUnwrap(page["entries"] as? [[String: Any]])
        let attachments = entries.flatMap { entry in
            (entry["payload"] as? [String: Any])?["attachments"] as? [[String: Any]] ?? []
        }.filter { $0["file_name"] as? String == fileName }
        XCTAssertEqual(attachments.count, 1, "The recipient must receive exactly one document")
        let media = try XCTUnwrap(attachments.first)
        XCTAssertEqual(media["content_type"] as? String, "application/pdf")
        XCTAssertEqual(media["status"] as? String, "published")
        let id = try XCTUnwrap(media["id"] as? String)
        var download = URLRequest(
            url: config.origin.appendingPathComponent(
                "api/v1/meetings/" + meeting + "/media/" + id + "/content"))
        download.setValue("Bearer " + token, forHTTPHeaderField: "Authorization")
        let (data, response) = try await session.data(for: download)
        XCTAssertEqual(try XCTUnwrap(response as? HTTPURLResponse).statusCode, 200)
        XCTAssertEqual(data.count, media["size_bytes"] as? Int)
        XCTAssertTrue(data.starts(with: Data("%PDF-".utf8)))
        let digest = SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
        XCTAssertEqual(digest, sha256, "The recipient must download the original PDF bytes")
        print("SOMEWHERE_PDF_RECIPIENT bytes=\(data.count) sha256=\(digest)")
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

    func request(
        _ path: String, method: String = "GET", body: [String: Any]? = nil,
        key: String = UUID().uuidString.lowercased()
    ) async throws -> [String: Any] {
        var request = URLRequest(url: config.origin.appendingPathComponent("api/v1/" + path))
        request.httpMethod = method
        request.setValue("Bearer " + token, forHTTPHeaderField: "Authorization")
        request.setValue("chat-counterpart", forHTTPHeaderField: "X-Somewhere-Test-Scenario")
        if path == "me", method == "DELETE" {
            var bytes = [UInt8](repeating: 0, count: 32)
            guard SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes) == errSecSuccess else {
                throw URLError(.unknown)
            }
            let value = Data(bytes).base64EncodedString().replacingOccurrences(of: "=", with: "")
                .replacingOccurrences(of: "+", with: "-").replacingOccurrences(of: "/", with: "_")
            request.setValue(value, forHTTPHeaderField: "X-Deletion-Token")
        }
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
        if status == 204 { return [:] }
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
