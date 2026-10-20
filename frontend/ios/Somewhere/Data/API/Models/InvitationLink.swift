import Foundation

struct InvitationLink: Codable, Equatable, Sendable {
    let invitationURL: URL

    enum CodingKeys: String, CodingKey {
        case invitationURL = "invitation_url"
    }
}
