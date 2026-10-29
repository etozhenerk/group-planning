import Foundation

struct MemorySnapshot: Decodable, Sendable {
    let photos: [MeetingMedia]

    enum CodingKeys: String, CodingKey {
        case photos
        case nextCursor = "next_cursor"
    }

    init(photos: [MeetingMedia]) { self.photos = photos }

    init(from decoder: any Decoder) throws {
        let values = try decoder.container(keyedBy: CodingKeys.self)
        guard try values.decodeNil(forKey: .nextCursor) else {
            throw AlbumSaveFailure.invalidSnapshot
        }
        photos = try values.decode([MeetingMedia].self, forKey: .photos)
    }
}
