import Foundation

struct FeedPage: Codable, Equatable, Sendable {
    let entries: [FeedEntry]
    let hasMore: Bool
    let meetingRevision: ServerCounter
    let participantCount: Int
    let myRSVP: RSVPAnswer?
    let myRSVPRevision: ServerCounter
    let latestSequence: ServerCounter

    enum CodingKeys: String, CodingKey {
        case entries
        case hasMore = "has_more"
        case meetingRevision = "meeting_revision"
        case participantCount = "participant_count"
        case myRSVP = "my_rsvp"
        case myRSVPRevision = "my_rsvp_revision"
        case latestSequence = "latest_sequence"
    }
}
