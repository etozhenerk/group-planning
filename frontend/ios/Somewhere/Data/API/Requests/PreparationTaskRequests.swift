import Foundation

enum PreparationTaskRequests {
    static func path(_ meeting: UUID, _ task: UUID? = nil) -> [String] {
        ["meetings", meeting.uuidString.lowercased(), "preparation-tasks"]
            + (task.map { [$0.uuidString.lowercased()] } ?? [])
    }

    static func read(_ meeting: UUID, _ task: UUID) -> APIRequest {
        APIRequest(
            path: path(meeting, task), meetingID: meeting, invalidatesMeetingOnForbidden: true)
    }

    static func create(_ meeting: UUID, title: String, recipient: UUID?) throws -> APIRequest {
        let body: [String: String?] = [
            "title": title, "recipient_id": recipient?.uuidString.lowercased(),
        ]
        return try .json(
            path: path(meeting), method: .post, body: body, key: UUID(), status: 201,
            meetingID: meeting, invalidatesMeetingOnForbidden: true)
    }

    static func act(_ task: PreparationTask, action: PreparationAction) throws -> APIRequest {
        try .json(
            path: path(task.meetingID, task.id) + [action.rawValue], method: .post,
            body: ["expected_revision": task.revision.rawValue], key: UUID(),
            meetingID: task.meetingID, invalidatesMeetingOnForbidden: true)
    }
}
