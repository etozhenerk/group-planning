import Foundation

struct AlbumPhoto: Equatable, Sendable {
    static let maximumPhotoBytes = 10 * 1024 * 1024
    static let maximumAlbumBytes = 1024 * 1024 * 1024
    let id: UUID
    let contentType: String
    let sizeBytes: Int
    let fileName: String

    static func validate(_ snapshot: MemorySnapshot, meetingID: UUID) throws -> [AlbumPhoto] {
        guard !snapshot.photos.isEmpty else { throw AlbumSaveFailure.empty }
        var seen = Set<UUID>()
        var total = 0
        return try snapshot.photos.map { media in
            let extensions = ["image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"]
            guard media.meetingID == meetingID, media.purpose == "memory",
                media.kind == "photo", media.status == "published",
                seen.insert(media.id).inserted, let suffix = extensions[media.contentType],
                (1...maximumPhotoBytes).contains(media.sizeBytes),
                media.sizeBytes <= maximumAlbumBytes - total
            else { throw AlbumSaveFailure.invalidSnapshot }
            total += media.sizeBytes
            return AlbumPhoto(
                id: media.id, contentType: media.contentType, sizeBytes: media.sizeBytes,
                fileName: media.id.uuidString.lowercased() + "." + suffix)
        }
    }
}

struct AlbumPreparedPhoto: Sendable {
    let photo: AlbumPhoto
    let fileURL: URL
}
