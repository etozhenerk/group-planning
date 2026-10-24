import Foundation

struct InvitationPreview: Codable, Equatable, Sendable {
    let meetingID: UUID
    let title: String
    let description: String?
    let startsAt: APIInstant?
    let timezone: String
    let place: String?
    let coverURL: URL?
    let myRSVP: RSVPAnswer?
    let myRSVPRevision: ServerCounter

    var startsOn: String?

    enum CodingKeys: String, CodingKey {
        case meetingID = "meeting_id"
        case title
        case description
        case startsAt = "starts_at"
        case startsOn = "starts_on"
        case timezone
        case place
        case coverURL = "cover_url"
        case myRSVP = "my_rsvp"
        case myRSVPRevision = "my_rsvp_revision"
    }
}
