import Foundation

struct CreateMeeting: Codable, Equatable, Sendable {
    let title: String
    let description: String?
    let startsAt: APIInstant?
    let timezone: String
    let place: String?
    var startsOn: String?

    enum CodingKeys: String, CodingKey {
        case title
        case description
        case startsAt = "starts_at"
        case startsOn = "starts_on"
        case timezone
        case place
    }
}
