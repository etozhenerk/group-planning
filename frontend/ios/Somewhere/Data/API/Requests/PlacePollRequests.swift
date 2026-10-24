import Foundation

enum PlacePollRequests {
    static func path(_ meeting: UUID, _ poll: UUID? = nil) -> [String] {
        ["meetings", meeting.uuidString.lowercased(), "place-polls"]
            + (poll.map { [$0.uuidString.lowercased()] } ?? [])
    }

    static func read(_ meeting: UUID, _ poll: UUID) -> APIRequest {
        APIRequest(
            path: path(meeting, poll), meetingID: meeting, invalidatesMeetingOnForbidden: true)
    }

    static func create(_ meeting: UUID, place: String, deadline: Date) throws -> APIRequest {
        try .json(
            path: path(meeting), method: .post,
            body: ["place": place, "closes_at": deadline.ISO8601Format()],
            key: UUID(), status: 201, meetingID: meeting, invalidatesMeetingOnForbidden: true)
    }

    static func vote(_ poll: PlacePoll, answer: String) throws -> APIRequest {
        try .json(
            path: path(poll.meetingID, poll.id) + ["vote"], method: .put,
            body: ["answer": answer, "expected_revision": poll.myVoteRevision.rawValue],
            key: UUID(), meetingID: poll.meetingID, invalidatesMeetingOnForbidden: true)
    }
}
