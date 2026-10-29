import Foundation
import Testing

@testable import Somewhere

struct AlbumFileBufferTests {
    @Test func streamsAcrossBoundariesWithoutChangingBytes() throws {
        let file = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        #expect(FileManager.default.createFile(atPath: file.path, contents: nil))
        let original = Data((0..<(AlbumFileBuffer.chunkBytes * 2 + 7)).map { UInt8($0 % 251) })
        let writer = try AlbumFileBuffer(fileURL: file, expectedBytes: original.count)
        for byte in original { try writer.append(byte) }
        try writer.finish()
        try writer.close()
        #expect(try Data(contentsOf: file) == original)
        try FileManager.default.removeItem(at: file)
    }

    @Test func rejectsShortExcessAndOversizeWithoutGrowingPastLimit() throws {
        let file = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        #expect(FileManager.default.createFile(atPath: file.path, contents: nil))
        let writer = try AlbumFileBuffer(fileURL: file, expectedBytes: 2)
        try writer.append(1)
        #expect(throws: ClientFailure.invalidResponse) { try writer.finish() }
        try writer.append(2)
        #expect(throws: ClientFailure.invalidResponse) { try writer.append(3) }
        try writer.finish()
        try writer.close()
        #expect(try Data(contentsOf: file) == Data([1, 2]))
        #expect(throws: ClientFailure.invalidRequest) {
            try AlbumFileBuffer(fileURL: file, expectedBytes: AlbumPhoto.maximumPhotoBytes + 1)
        }
        try FileManager.default.removeItem(at: file)
    }
}
