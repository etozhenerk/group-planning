import Foundation

struct Participant: Codable, Equatable, Sendable {
    let user: UserProfile
    let role: String
    let rsvp: RSVPAnswer?
    let rsvpRevision: ServerCounter

    enum CodingKeys: String, CodingKey {
        case user
        case role
        case rsvp
        case rsvpRevision = "rsvp_revision"
    }
}
