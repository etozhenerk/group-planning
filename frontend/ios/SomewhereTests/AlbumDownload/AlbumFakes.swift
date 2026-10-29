import Foundation
import Testing

@testable import Somewhere

@MainActor
final class AlbumSourceFake: AlbumPhotoSource {
    let meetingID = UUID()
    var data = Data([0xFF, 0xD8, 0x45, 0x78, 0x69, 0x66, 0x00, 0xFF, 0xD9])
    var media: [MeetingMedia] = []
    var snapshotCalls = 0
    var downloaded: [UUID] = []
    var verifyCalls = 0
    var revoked = false
    var onDownload: (@MainActor () async throws -> Void)?
    var onVerify: (@MainActor () throws -> Void)?

    init(count: Int = 2) throws {
        media = try (0..<count).map { _ in try photo() }
    }

    func photo(size: Int? = nil, purpose: String = "memory") throws -> MeetingMedia {
        try MeetingMedia(
            id: UUID(), meetingID: meetingID, fileName: "../../duplicate.jpg",
            contentType: "image/jpeg", sizeBytes: size ?? data.count,
            kind: "photo", purpose: purpose, status: "published",
            downloadURL: "https://untrusted.example/secret", thumbnailURL: nil,
            createdAt: APIInstant("2026-10-20T12:00:00Z"),
            uploadedBy: UserProfile(id: UUID(), displayName: "Тест"))
    }

    func checkAccess() throws {
        if revoked { throw ClientFailure.accessRevoked }
    }

    func snapshot() async throws -> MemorySnapshot {
        snapshotCalls += 1
        return MemorySnapshot(photos: media)
    }

    func download(_ photo: AlbumPhoto, to fileURL: URL) async throws {
        downloaded.append(photo.id)
        try await onDownload?()
        try data.write(to: fileURL)
    }

    func verifyAccess() async throws {
        verifyCalls += 1
        try onVerify?()
    }
}

@MainActor
final class AlbumLibraryFake: AlbumPhotoLibrary {
    var denied = false
    var permissionCalls = 0
    var saved: [[Data]] = []
    var names: [String] = []
    var onSave: (@MainActor () async throws -> Void)?

    func requireAddPermission() async throws {
        permissionCalls += 1
        if denied { throw AlbumSaveFailure.permissionRequired }
    }

    func save(_ photos: [AlbumPreparedPhoto]) async throws {
        saved.append(try photos.map { try Data(contentsOf: $0.fileURL) })
        names = photos.map { $0.fileURL.lastPathComponent }
        try await onSave?()
    }
}

@MainActor
struct AlbumHarness {
    let source: AlbumSourceFake
    let library = AlbumLibraryFake()
    let root = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
    let service: AlbumDownloadService

    init(count: Int = 2) throws {
        source = try AlbumSourceFake(count: count)
        service = AlbumDownloadService(
            source: source, library: library, files: AlbumTemporaryFiles(root: root))
    }

    func expectClean() throws {
        if FileManager.default.fileExists(atPath: root.path) {
            #expect(try FileManager.default.contentsOfDirectory(atPath: root.path).isEmpty)
            try FileManager.default.removeItem(at: root)
        }
    }
}
