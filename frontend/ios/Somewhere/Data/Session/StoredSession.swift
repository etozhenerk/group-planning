import Foundation

struct StoredSession: Codable, Sendable, CustomDebugStringConvertible {
    let id: UUID
    let token: String
    let expiresAt: Date

    init(token: String, expiresAt: Date, id: UUID = UUID()) throws {
        let allowed = Set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~+/=")
        guard !token.isEmpty, token.allSatisfy({ allowed.contains($0) }),
            expiresAt.timeIntervalSince1970.isFinite
        else { throw ClientFailure.invalidStoredSession }
        self.id = id
        self.token = token
        self.expiresAt = expiresAt
    }

    enum CodingKeys: String, CodingKey { case id, token, expiresAt }

    init(from decoder: any Decoder) throws {
        let values = try decoder.container(keyedBy: CodingKeys.self)
        try self.init(
            token: values.decode(String.self, forKey: .token),
            expiresAt: values.decode(Date.self, forKey: .expiresAt),
            id: values.decode(UUID.self, forKey: .id))
    }

    var debugDescription: String { "StoredSession(redacted)" }
}
