import Foundation
import Testing

@testable import Somewhere

@Suite("System document selection")
struct MediaSelectionTests {
    @Test func coordinatedPDFKeepsMIMEBytesAndName() async throws {
        let folder = FileManager.default.temporaryDirectory.appendingPathComponent(
            UUID().uuidString)
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: folder) }
        let url = folder.appendingPathComponent("правила.pdf")
        let data = Data("%PDF-1.4\n1 0 obj <<>> endobj\n%%EOF\n".utf8)
        try data.write(to: url)
        let files = try await MediaFileReader.read([url])
        let selected = try #require(files.first)
        #expect(files.count == 1)
        #expect(selected.contentType == "application/pdf")
        #expect(selected.data == data)
        #expect(selected.name == "правила.pdf")
        #expect(selected.stage == .ready)
    }

    @Test func missingProviderFileDoesNotProduceAnEmptySelection() async throws {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(
            UUID().uuidString + ".pdf")
        await #expect(throws: (any Error).self) { try await MediaFileReader.read([url]) }
    }
}
