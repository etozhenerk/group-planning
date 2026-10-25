import Foundation

struct PreparedCover: Codable, Equatable, Hashable, Sendable {
    let mediaType: String
    let data: Data

    enum CodingKeys: String, CodingKey {
        case mediaType = "media_type"
        case data
    }
}
