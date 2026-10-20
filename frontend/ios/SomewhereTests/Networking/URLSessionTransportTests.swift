import Foundation
import Testing
import os

@testable import Somewhere

final class StubURLProtocol: URLProtocol, @unchecked Sendable {
    struct State {
        var started: Set<String> = []
        var stopped: Set<String> = []
    }
    static let state = OSAllocatedUnfairLock(initialState: State())

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        guard let url = request.url else { return }
        Self.state.withLock {
            $0.started.insert(url.path)
            return
        }
        if url.path == "/wait" { return }
        guard
            let response = HTTPURLResponse(
                url: url, statusCode: 200,
                httpVersion: "HTTP/1.1", headerFields: ["Content-Type": "application/json"])
        else { return }
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: Data("{\"ok\":true}".utf8))
        client?.urlProtocolDidFinishLoading(self)
    }

    override func stopLoading() {
        if let path = request.url?.path {
            Self.state.withLock {
                $0.stopped.insert(path)
                return
            }
        }
    }
}

@Suite(.serialized)
struct URLSessionTransportTests {
    @Test func adapterReturnsHTTPDataAndCancelsUnderlyingTask() async throws {
        StubURLProtocol.state.withLock { $0 = StubURLProtocol.State() }
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [StubURLProtocol.self]
        let transport = URLSessionTransport(configuration: configuration)
        let request = URLRequest(url: try #require(URL(string: "https://api.example.test/ok")))
        let (data, response) = try await transport.data(for: request)
        #expect(response.statusCode == 200)
        #expect(String(data: data, encoding: .utf8) == "{\"ok\":true}")
        let pending = URLRequest(url: try #require(URL(string: "https://api.example.test/wait")))
        let task = Task { try await transport.data(for: pending) }
        for _ in 0..<200 {
            if StubURLProtocol.state.withLock({ $0.started.contains("/wait") }) { break }
            try await Task.sleep(for: .milliseconds(10))
        }
        #expect(StubURLProtocol.state.withLock { $0.started.contains("/wait") })
        task.cancel()
        do {
            _ = try await task.value
            Issue.record("Canceled URLSession request succeeded")
        } catch { #expect((error as? URLError)?.code == .cancelled || error is CancellationError) }
        for _ in 0..<200 {
            if StubURLProtocol.state.withLock({ $0.stopped.contains("/wait") }) { break }
            try await Task.sleep(for: .milliseconds(10))
        }
        #expect(StubURLProtocol.state.withLock { $0.stopped.contains("/wait") })
    }

    @Test func redirectDelegateRejectsDestination() throws {
        let url = try #require(URL(string: "https://api.example.test/redirect"))
        let response = try #require(
            HTTPURLResponse(url: url, statusCode: 302, httpVersion: nil, headerFields: nil))
        let session = URLSession(configuration: .ephemeral)
        defer { session.invalidateAndCancel() }
        let result = OSAllocatedUnfairLock(initialState: false)
        NoRedirectDelegate().urlSession(
            session, task: session.dataTask(with: url),
            willPerformHTTPRedirection: response, newRequest: URLRequest(url: url)
        ) { request in
            result.withLock { $0 = request == nil }
        }
        #expect(result.withLock { $0 })
    }
}
