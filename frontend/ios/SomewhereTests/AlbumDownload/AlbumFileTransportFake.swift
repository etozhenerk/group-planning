import Foundation

@testable import Somewhere

actor AlbumFileTransportFake: HTTPFileTransport {
    private(set) var requests: [URLRequest] = []
    private(set) var wasCancelled = false
    let gate: TestGate?
    let failure: ClientFailure?

    init(gate: TestGate? = nil, failure: ClientFailure? = nil) {
        self.gate = gate
        self.failure = failure
    }

    func download(
        _ request: URLRequest, to fileURL: URL, expectedBytes: Int, contentType: String
    ) async throws {
        requests.append(request)
        if let gate { await gate.wait() }
        wasCancelled = Task.isCancelled
        if let failure { throw failure }
        try Data(repeating: 1, count: expectedBytes).write(to: fileURL)
    }
}
