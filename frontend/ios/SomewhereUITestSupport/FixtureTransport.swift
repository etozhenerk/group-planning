import Foundation
import Security
import os

// Compiled only into SomewhereUITestHost; production keeps system TLS validation.
final class FixtureTransport: HTTPTransport {
    private let session: URLSession
    private let requests = OSAllocatedUnfairLock(initialState: [String: Int]())
    private let scenario: String
    init(origin: URL, certificate: Data, scenario: String) {
        self.scenario = scenario
        let config = URLSessionConfiguration.ephemeral
        config.httpShouldSetCookies = false
        config.httpCookieStorage = nil
        config.urlCache = nil
        config.requestCachePolicy = .reloadIgnoringLocalCacheData
        config.timeoutIntervalForRequest = 10
        config.timeoutIntervalForResource = 15
        config.httpAdditionalHeaders = ["X-Somewhere-Test-Scenario": scenario]
        session = URLSession(
            configuration: config,
            delegate: FixtureTrust(origin: origin, certificate: certificate), delegateQueue: nil)
    }
    deinit { session.invalidateAndCancel() }
    func data(for request: URLRequest) async throws -> (Data, HTTPURLResponse) {
        if let file = ProcessInfo.processInfo.environment["SOMEWHERE_UI_HTTP_TRACE"] {
            requests.withLock { counts in
                counts[request.url?.path ?? "unknown", default: 0] += 1
                do {
                    try JSONEncoder().encode(counts).write(
                        to: URL(fileURLWithPath: file), options: .atomic)
                } catch { print("SOMEWHERE_HTTP_TRACE_WRITE_FAILED") }
            }
        }
        if scenario != "profile-fields", request.url?.path == "/api/v1/auth/yandex/start" {
            try await Task.sleep(for: .milliseconds(300))
            throw URLError(.notConnectedToInternet)
        }
        if scenario == "audit-loading", request.url?.path == "/api/v1/me" {
            try await Task.sleep(for: .seconds(7))
        }
        try await FixtureResponseGate.before(request)
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw ClientFailure.invalidResponse }
        return try await FixtureResponseGate.apply((data, http), to: request)
    }
}

private final class FixtureTrust: NSObject, URLSessionDelegate, URLSessionTaskDelegate {
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
            space.host == origin.host, space.port == origin.port,
            let trust = space.serverTrust,
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
    func urlSession(
        _ session: URLSession, task: URLSessionTask,
        willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest,
        completionHandler: @escaping (URLRequest?) -> Void
    ) {
        completionHandler(nil)
    }
}
