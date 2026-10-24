import Foundation

struct PendingAuthAttempt: Codable, Sendable, CustomDebugStringConvertible {
    let id: UUID
    let verifier: String
    let expiresAt: Date
    let context: ReturnContext
    var debugDescription: String { "PendingAuthAttempt(redacted)" }
}
