import Foundation

struct UserProfile: Codable, Equatable, Sendable {
    let id: UUID
    let displayName: String

    var avatarURL: URL?

    enum CodingKeys: String, CodingKey {
        case id
        case displayName = "display_name"
        case avatarURL = "avatar_url"
    }
}
