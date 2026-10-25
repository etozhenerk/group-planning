import Foundation

struct Meeting: Codable, Equatable, Sendable {
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
    let organizerID: UUID
    let description: String?
    let createdAt: APIInstant

    var period: String?
    var startsOn: String?

    enum CodingKeys: String, CodingKey {
        case id
        case title
        case period
        case startsAt = "starts_at"
        case startsOn = "starts_on"
        case timezone
        case place
        case coverURL = "cover_url"
        case participantCount = "participant_count"
        case revision
        case myRSVP = "my_rsvp"
        case myRSVPRevision = "my_rsvp_revision"
        case organizerID = "organizer_id"
        case description
        case createdAt = "created_at"
    }
}
