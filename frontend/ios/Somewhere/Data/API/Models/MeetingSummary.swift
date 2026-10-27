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

    var unreadCount: ServerCounter?
    var firstUnread: UUID?
    var period: String?
    var startsOn: String?
    var organizerID: UUID?
    var participantPreview: [UserProfile]?
    var memoryPhotoCount: Int?
    var memoryPreview: [MeetingMedia]?

    enum CodingKeys: String, CodingKey {
        case id
        case unreadCount = "unread_count"
        case firstUnread = "first_unread"
        case organizerID = "organizer_id"
        case participantPreview = "participant_preview"
        case memoryPhotoCount = "memory_photo_count"
        case memoryPreview = "memory_preview"
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
    }
}
