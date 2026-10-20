import Foundation

struct CreatedMeeting: Codable, Equatable, Sendable {
    let meeting: Meeting
    let role: String
    let invitationURL: URL

    enum CodingKeys: String, CodingKey {
        case meeting
        case role
        case invitationURL = "invitation_url"
    }
}
