import Foundation
import Testing

@testable import Somewhere

// Keep these adapter checks in the existing serialized suite: they use its URLProtocol fixture.
extension URLSessionTransportTests {
    @Test func albumStreamWritesResponseBytesUnchanged() async throws {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [StubURLProtocol.self]
        let transport = URLSessionFileTransport(configuration: configuration)
        let file = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try #require(FileManager.default.createFile(atPath: file.path, contents: nil))
        let request = URLRequest(url: try #require(URL(string: "https://api.example.test/album")))
        try await transport.download(
            request, to: file, expectedBytes: 11, contentType: "application/json")
        #expect(try Data(contentsOf: file) == Data("{\"ok\":true}".utf8))
        try FileManager.default.removeItem(at: file)
    }

    @Test func albumStreamRejectsErrorMimeAndIncorrectActualSize() async throws {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [StubURLProtocol.self]
        let transport = URLSessionFileTransport(configuration: configuration)
        let file = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try #require(FileManager.default.createFile(atPath: file.path, contents: nil))
        let request = URLRequest(url: try #require(URL(string: "https://api.example.test/album")))
        await #expect(throws: ClientFailure.invalidResponse) {
            try await transport.download(
                request, to: file, expectedBytes: 11, contentType: "image/jpeg")
        }
        #expect(try Data(contentsOf: file).isEmpty)
        for size in [10, 12] {
            await #expect(throws: ClientFailure.invalidResponse) {
                try await transport.download(
                    request, to: file, expectedBytes: size, contentType: "application/json")
            }
            #expect(try Data(contentsOf: file).count <= size)
        }
        try FileManager.default.removeItem(at: file)
    }

    @Test func albumStreamCancellationStopsUnderlyingRequest() async throws {
        StubURLProtocol.state.withLock { $0 = StubURLProtocol.State() }
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [StubURLProtocol.self]
        let transport = URLSessionFileTransport(configuration: configuration)
        let file = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try #require(FileManager.default.createFile(atPath: file.path, contents: nil))
        let request = URLRequest(url: try #require(URL(string: "https://api.example.test/wait")))
        let worker = Task {
            try await transport.download(
                request, to: file, expectedBytes: 11, contentType: "application/json")
        }
        for _ in 0..<200 {
            if StubURLProtocol.state.withLock({ $0.started.contains("/wait") }) { break }
            try await Task.sleep(for: .milliseconds(10))
        }
        #expect(StubURLProtocol.state.withLock { $0.started.contains("/wait") })
        worker.cancel()
        do {
            try await worker.value
            Issue.record("Canceled album stream succeeded")
        } catch {
            #expect(error is CancellationError || (error as? URLError)?.code == .cancelled)
        }
        for _ in 0..<200 {
            if StubURLProtocol.state.withLock({ $0.stopped.contains("/wait") }) { break }
            try await Task.sleep(for: .milliseconds(10))
        }
        #expect(StubURLProtocol.state.withLock { $0.stopped.contains("/wait") })
        #expect(try Data(contentsOf: file).isEmpty)
        try FileManager.default.removeItem(at: file)
    }
}
