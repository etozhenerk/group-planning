import Foundation

struct CalendarMeeting: Decodable, Equatable, Sendable, Identifiable {
    let meeting: MeetingSummary
    let localDate: String?
    let period: MeetingPeriod
    var id: UUID { meeting.id }

    enum CodingKeys: String, CodingKey {
        case localDate = "local_date"
        case period
    }

    init(from decoder: any Decoder) throws {
        meeting = try MeetingSummary(from: decoder)
        let values = try decoder.container(keyedBy: CodingKeys.self)
        localDate = try values.decodeIfPresent(String.self, forKey: .localDate)
        period = try values.decode(MeetingPeriod.self, forKey: .period)
        guard localDate.map({ CalendarDate.parse($0) != nil }) ?? (period == .undated) else {
            throw ClientFailure.invalidResponse
        }
    }
}

struct CalendarPage: Decodable, Sendable {
    struct Counts: Decodable, Equatable, Sendable {
        let upcoming: Int
        let past: Int
        let undated: Int
        var total: Int { upcoming + past + undated }
    }
    struct Day: Decodable, Sendable {
        let date: String
        let count: Int
    }
    var meetings: [CalendarMeeting]
    var nextCursor: String?
    let asOf: APIInstant
    let counts: Counts
    let days: [Day]
    let nextTransitionAt: APIInstant?
    let refreshAfterSeconds: Int

    enum CodingKeys: String, CodingKey {
        case meetings, counts, days
        case nextCursor = "next_cursor"
        case asOf = "as_of"
        case nextTransitionAt = "next_transition_at"
        case refreshAfterSeconds = "refresh_after_seconds"
    }
}

enum MeetingPeriod: String, Codable, CaseIterable, Sendable {
    case upcoming, past, undated
    var title: String {
        switch self {
        case .upcoming: "Предстоящие"
        case .past: "Прошедшие"
        case .undated: "Без даты"
        }
    }
}
