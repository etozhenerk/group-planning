import Foundation

struct CurrentSession: Codable, Equatable, Sendable {
    let user: UserProfile
    let expiresAt: APIInstant
    let csrfToken: String?

    enum CodingKeys: String, CodingKey {
        case user
        case expiresAt = "expires_at"
        case csrfToken = "csrf_token"
    }
}
