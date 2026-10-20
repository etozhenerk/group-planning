import Foundation

enum ReturnContext: Codable, Equatable, Sendable {
    case home
    case invitation(String)

    enum CodingKeys: String, CodingKey { case kind, token }

    init(from decoder: any Decoder) throws {
        let values = try decoder.container(keyedBy: CodingKeys.self)
        switch try values.decode(String.self, forKey: .kind) {
        case "home": self = .home
        case "invitation":
            let token = try values.decode(String.self, forKey: .token)
            guard APIRequest.isInvitationToken(token) else { throw ClientFailure.invalidResponse }
            self = .invitation(token)
        default: throw ClientFailure.invalidResponse
        }
    }

    func encode(to encoder: any Encoder) throws {
        var values = encoder.container(keyedBy: CodingKeys.self)
        switch self {
        case .home: try values.encode("home", forKey: .kind)
        case .invitation(let token):
            guard APIRequest.isInvitationToken(token) else { throw ClientFailure.invalidRequest }
            try values.encode("invitation", forKey: .kind)
            try values.encode(token, forKey: .token)
        }
    }
}
