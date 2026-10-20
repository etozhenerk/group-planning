import Foundation

enum MeetingRequests {
    static func list(cursor: String? = nil) -> APIRequest {
        let query = cursor.map { [URLQueryItem(name: "cursor", value: $0)] } ?? []
        return APIRequest(path: ["meetings"], query: query)
    }

    static func details(_ id: UUID) -> APIRequest {
        APIRequest(
            path: ["meetings", id.uuidString.lowercased()], meetingID: id,
            invalidatesMeetingOnForbidden: true)
    }

    static func participants(_ id: UUID) -> APIRequest {
        APIRequest(
            path: ["meetings", id.uuidString.lowercased(), "participants"], meetingID: id,
            invalidatesMeetingOnForbidden: true)
    }

    static func invitation(_ id: UUID) -> APIRequest {
        APIRequest(path: ["meetings", id.uuidString.lowercased(), "invitation"], meetingID: id)
    }

    static func create(_ input: CreateMeeting, key: UUID) throws -> APIRequest {
        try .json(path: ["meetings"], method: .post, body: input, key: key, status: 201)
    }

    static func update(_ id: UUID, input: UpdateMeeting, key: UUID) throws -> APIRequest {
        try .json(
            path: ["meetings", id.uuidString.lowercased()], method: .patch,
            body: input, key: key, meetingID: id)
    }
}
