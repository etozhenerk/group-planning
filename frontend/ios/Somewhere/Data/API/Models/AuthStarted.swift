import Foundation

struct AuthStarted: Codable, Equatable, Sendable {
    let attemptID: UUID
    let authorizationURL: URL
    let expiresAt: APIInstant

    enum CodingKeys: String, CodingKey {
        case attemptID = "attempt_id"
        case authorizationURL = "authorization_url"
        case expiresAt = "expires_at"
    }
}
