import Foundation

@MainActor
final class AlbumDownloadService {
    private static var active = false
    private let source: any AlbumPhotoSource
    private let library: any AlbumPhotoLibrary
    private let files: AlbumTemporaryFiles
    private var completed: (operationID: UUID, count: Int)?

    init(
        source: any AlbumPhotoSource, library: any AlbumPhotoLibrary,
        files: AlbumTemporaryFiles = AlbumTemporaryFiles()
    ) {
        self.source = source
        self.library = library
        self.files = files
    }

    func save(operationID: UUID) async throws -> Int {
        try checkPreparation()
        if let completed, completed.operationID == operationID { return completed.count }
        guard !Self.active else { throw AlbumSaveFailure.busy }
        Self.active = true
        defer { Self.active = false }
        try await library.requireAddPermission()
        try checkPreparation()
        let snapshot = try await source.snapshot()
        try checkPreparation()
        let photos = try AlbumPhoto.validate(snapshot, meetingID: source.meetingID)
        let directory = try await files.create()
        var savedCount = 0
        do {
            try checkPreparation()
            var prepared: [AlbumPreparedPhoto] = []
            prepared.reserveCapacity(photos.count)
            for photo in photos {
                let file = try await files.prepare(photo, in: directory)
                try checkPreparation()
                try await source.download(photo, to: file)
                try checkPreparation()
                let item = AlbumPreparedPhoto(photo: photo, fileURL: file)
                try await files.validate(item)
                try checkPreparation()
                prepared.append(item)
            }
            try await source.verifyAccess()
            try checkPreparation()
            // The PhotoKit transaction owns the outcome from this point. Cancellation or
            // revocation cannot undo a submitted save; keep files until its completion.
            try await library.save(prepared)
            savedCount = prepared.count
            completed = (operationID, savedCount)
        } catch {
            do { try await files.remove(directory) } catch {
                throw AlbumSaveFailure.cleanup(savedCount: 0)
            }
            throw error
        }
        do { try await files.remove(directory) } catch {
            throw AlbumSaveFailure.cleanup(savedCount: savedCount)
        }
        return savedCount
    }

    private func checkPreparation() throws {
        try Task.checkCancellation()
        try source.checkAccess()
    }
}
