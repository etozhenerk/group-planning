import Foundation

struct PendingAccountDeletion: Codable, Sendable, CustomDebugStringConvertible {
    let token: String
    let userID: UUID

    var debugDescription: String { "PendingAccountDeletion(redacted)" }
}
