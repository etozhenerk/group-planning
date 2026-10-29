import Foundation

@MainActor
protocol AlbumPhotoLibrary {
    func requireAddPermission() async throws
    /// Once submitted, wait for the system's completion even if the caller cancels.
    func save(_ photos: [AlbumPreparedPhoto]) async throws
}
