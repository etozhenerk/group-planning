import Foundation

struct AccountProfile: Decodable, Sendable {
    let id: UUID
    let displayName: String
    let avatarURL: URL?
    let email: String?
    let phone: String?
    let login: String?
    let firstName: String?
    let lastName: String?
    let birthday: String?
    let sex: String?
    let provider: String
    enum CodingKeys: String, CodingKey {
        case id, email, phone, provider, login, birthday, sex
        case displayName = "display_name"
        case avatarURL = "avatar_url"
        case firstName = "first_name"
        case lastName = "last_name"
    }
}
