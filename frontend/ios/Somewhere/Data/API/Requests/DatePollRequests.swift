import Foundation

enum DatePollRequests {
    static func path(_ meeting: UUID, _ poll: UUID? = nil) -> [String] {
        let base = ["meetings", meeting.uuidString.lowercased(), "date-polls"]
        return base + (poll.map { [$0.uuidString.lowercased()] } ?? [])
    }

    static func read(_ meeting: UUID, _ poll: UUID) -> APIRequest {
        APIRequest(
            path: path(meeting, poll), meetingID: meeting, invalidatesMeetingOnForbidden: true)
    }

    static func create(_ meeting: UUID, dates: [String], deadline: Date, settings: DatePollSettings)
        throws -> APIRequest
    {
        try .json(
            path: path(meeting), method: .post,
            body: Creation(dates: dates, closesAt: deadline.ISO8601Format(), settings: settings),
            key: UUID(), status: 201, meetingID: meeting, invalidatesMeetingOnForbidden: true)
    }

    static func action(_ poll: DatePoll, kind: String, fields: [String: JSONValue]) throws
        -> APIRequest
    {
        var body = fields
        body["expected_revision"] = .string(
            kind == "vote" ? poll.myVoteRevision.rawValue : poll.revision.rawValue)
        return try .json(
            path: path(poll.meetingID, poll.id) + [kind], method: kind == "vote" ? .put : .post,
            body: body, key: UUID(), meetingID: poll.meetingID,
            invalidatesMeetingOnForbidden: kind != "resolve")
    }

    private struct Creation: Encodable {
        let dates: [String]
        let closesAt: String
        let settings: DatePollSettings
        enum CodingKeys: String, CodingKey {
            case dates, settings
            case closesAt = "closes_at"
        }
    }
}
