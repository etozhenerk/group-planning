import Foundation
import Testing

@testable import Somewhere

actor TestGate {
    private var opened = false
    private var waiters: [CheckedContinuation<Void, Never>] = []

    func wait() async {
        if opened { return }
        await withCheckedContinuation { waiters.append($0) }
    }

    func release() {
        opened = true
        for waiter in waiters { waiter.resume() }
        waiters.removeAll()
    }
}

actor TestTransport: HTTPTransport {
    struct Reply: Sendable {
        let status: Int
        let data: Data
        let mime: String
        let gate: TestGate?
    }
    private var replies: [String: [Reply]] = [:]
    private(set) var requests: [URLRequest] = []

    func enqueue(
        _ path: String, data: Data = Data(), status: Int = 200,
        mime: String = "application/json", gate: TestGate? = nil
    ) {
        replies[path, default: []].append(Reply(status: status, data: data, mime: mime, gate: gate))
    }

    func count(_ path: String) -> Int { requests.filter { $0.url?.path == path }.count }

    func waitFor(_ path: String, count: Int = 1) async throws {
        for _ in 0..<200 {
            if self.count(path) >= count { return }
            try await Task.sleep(for: .milliseconds(10))
        }
        throw ClientFailure.invalidRequest
    }

    func data(for request: URLRequest) async throws -> (Data, HTTPURLResponse) {
        requests.append(request)
        let url = try #require(request.url)
        var queue = replies[url.path] ?? []
        guard !queue.isEmpty else {
            throw ClientFailure.network(URLError.notConnectedToInternet.rawValue)
        }
        let reply = queue.removeFirst()
        replies[url.path] = queue
        // Deliberately ignores cancellation to model a response already in flight.
        if let gate = reply.gate { await gate.wait() }
        let response = try #require(
            HTTPURLResponse(
                url: url, statusCode: reply.status,
                httpVersion: "HTTP/1.1", headerFields: ["Content-Type": reply.mime]))
        return (reply.data, response)
    }
}
