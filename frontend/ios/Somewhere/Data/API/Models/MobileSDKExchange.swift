import Foundation

struct MobileSDKExchange: Encodable, Sendable {
    let attemptID: UUID
    let oauthToken: String
    let appVerifier: String

    enum CodingKeys: String, CodingKey {
        case attemptID = "attempt_id"
        case oauthToken = "oauth_token"
        case appVerifier = "app_verifier"
    }
    func encode(to encoder: any Encoder) throws {
        var values = encoder.container(keyedBy: CodingKeys.self)
        try values.encode(attemptID.uuidString.lowercased(), forKey: .attemptID)
        try values.encode(oauthToken, forKey: .oauthToken)
        try values.encode(appVerifier, forKey: .appVerifier)
    }
}
