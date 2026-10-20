import Foundation

struct MobileSession: Codable, Equatable, Sendable {
    let sessionToken: String
    let expiresAt: APIInstant
    let returnContext: ReturnContext

    enum CodingKeys: String, CodingKey {
        case sessionToken = "session_token"
        case expiresAt = "expires_at"
        case returnContext = "return_context"
    }
}
