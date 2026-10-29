import Foundation
import Testing

@testable import Somewhere

struct AlbumTemporaryFilesTests {
    @Test func abandonedCleanupNeverFollowsLinksOutsideOwnedRoot() async throws {
        let base = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        let root = base.appendingPathComponent("exports")
        let outside = base.appendingPathComponent("keep")
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        try FileManager.default.createDirectory(at: outside, withIntermediateDirectories: true)
        let original = outside.appendingPathComponent("photo.jpg")
        try Data([1, 2, 3]).write(to: original)
        let abandoned = root.appendingPathComponent("album-" + UUID().uuidString)
        try FileManager.default.createSymbolicLink(at: abandoned, withDestinationURL: outside)
        let storage = AlbumTemporaryFiles(root: root)
        let current = try await storage.create()
        #expect(!FileManager.default.fileExists(atPath: abandoned.path))
        #expect(try Data(contentsOf: original) == Data([1, 2, 3]))
        await #expect(throws: AlbumSaveFailure.storage) { try await storage.remove(outside) }
        let attributes = try FileManager.default.attributesOfItem(atPath: current.path)
        #expect((attributes[.posixPermissions] as? NSNumber)?.intValue == 0o700)
        try await storage.remove(current)
        #expect(try FileManager.default.contentsOfDirectory(atPath: root.path).isEmpty)
        try FileManager.default.removeItem(at: base)
    }
}
