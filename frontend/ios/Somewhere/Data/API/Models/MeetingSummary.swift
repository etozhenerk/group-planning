import Foundation

struct MeetingSummary: Codable, Equatable, Sendable {
    let id: UUID
    let title: String
    let startsAt: APIInstant?
    let timezone: String
    let place: String?
    let coverURL: URL?
    let participantCount: Int
    let revision: ServerCounter
    let myRSVP: RSVPAnswer?
    let myRSVPRevision: ServerCounter

    var startsOn: String?

    enum CodingKeys: String, CodingKey {
        case id
        case title
        case startsAt = "starts_at"
        case startsOn = "starts_on"
        case timezone
        case place
        case coverURL = "cover_url"
        case participantCount = "participant_count"
        case revision
        case myRSVP = "my_rsvp"
        case myRSVPRevision = "my_rsvp_revision"
    }
}
