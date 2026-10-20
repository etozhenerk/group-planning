import Foundation

struct MeetingsPage: Codable, Equatable, Sendable {
    let meetings: [MeetingSummary]
    let nextCursor: String?

    enum CodingKeys: String, CodingKey {
        case meetings
        case nextCursor = "next_cursor"
    }
}
