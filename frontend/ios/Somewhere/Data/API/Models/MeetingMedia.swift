import Foundation

struct MeetingMedia: Codable, Equatable, Identifiable, Sendable {
    let id: UUID
    let meetingID: UUID
    let fileName: String
    let contentType: String
    let sizeBytes: Int
    let kind: String
    let purpose: String
    let status: String
    let downloadURL: String?
    let thumbnailURL: String?
    let createdAt: APIInstant
    let uploadedBy: UserProfile

    enum CodingKeys: String, CodingKey {
        case id, kind, purpose, status
        case meetingID = "meeting_id"
        case fileName = "file_name"
        case contentType = "content_type"
        case sizeBytes = "size_bytes"
        case downloadURL = "download_url"
        case thumbnailURL = "thumbnail_url"
        case createdAt = "created_at"
        case uploadedBy = "uploaded_by"
    }
}

struct MediaEnvelope: Decodable, Sendable {
    let media: MeetingMedia
    let entry: FeedEntry?
}

struct MediaPage: Decodable, Sendable {
    let photos: [MeetingMedia]
    let nextCursor: String?
    enum CodingKeys: String, CodingKey {
        case photos
        case nextCursor = "next_cursor"
    }
}

struct MediaLimits: Decodable, Sendable {
    let maxPhotoBytes: Int
    let maxFileBytes: Int
    let maxFiles: Int
    let photoTypes: [String]
    let fileTypes: [String]
    enum CodingKeys: String, CodingKey {
        case maxPhotoBytes = "max_photo_bytes"
        case maxFileBytes = "max_file_bytes"
        case maxFiles = "max_files"
        case photoTypes = "photo_types"
        case fileTypes = "file_types"
    }
}
