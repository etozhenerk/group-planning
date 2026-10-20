import Foundation

struct MobileExchange: Encodable, Sendable {
    let attemptID: UUID
    let handoffCode: String
    let appVerifier: String

    enum CodingKeys: String, CodingKey {
        case attemptID = "attempt_id"
        case handoffCode = "handoff_code"
        case appVerifier = "app_verifier"
    }

    func encode(to encoder: any Encoder) throws {
        var values = encoder.container(keyedBy: CodingKeys.self)
        try values.encode(attemptID.uuidString.lowercased(), forKey: .attemptID)
        try values.encode(handoffCode, forKey: .handoffCode)
        try values.encode(appVerifier, forKey: .appVerifier)
    }
}
