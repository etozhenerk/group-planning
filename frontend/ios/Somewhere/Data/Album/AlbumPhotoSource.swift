import Foundation

@MainActor
protocol AlbumPhotoSource {
    var meetingID: UUID { get }
    func checkAccess() throws
    func snapshot() async throws -> MemorySnapshot
    func download(_ photo: AlbumPhoto, to fileURL: URL) async throws
    func verifyAccess() async throws
}
