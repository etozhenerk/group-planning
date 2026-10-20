import Foundation

struct AuthStart: Encodable, Sendable {
    let returnContext: ReturnContext
    let appChallenge: String

    enum CodingKeys: String, CodingKey {
        case clientKind = "client_kind"
        case returnContext = "return_context"
        case appChallenge = "app_challenge"
    }

    func encode(to encoder: any Encoder) throws {
        var values = encoder.container(keyedBy: CodingKeys.self)
        try values.encode("ios", forKey: .clientKind)
        try values.encode(returnContext, forKey: .returnContext)
        try values.encode(appChallenge, forKey: .appChallenge)
    }
}
