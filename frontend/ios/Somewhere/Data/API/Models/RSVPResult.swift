import Foundation

struct RSVPResult: Codable, Equatable, Sendable {
    let meetingID: UUID
    let rsvp: RSVPAnswer
    let rsvpRevision: ServerCounter
    let canAccessFeed: Bool
    let meetingRevision: ServerCounter

    enum CodingKeys: String, CodingKey {
        case meetingID = "meeting_id"
        case rsvp
        case rsvpRevision = "rsvp_revision"
        case canAccessFeed = "can_access_feed"
        case meetingRevision = "meeting_revision"
    }
}
