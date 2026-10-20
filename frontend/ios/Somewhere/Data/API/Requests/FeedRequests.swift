import Foundation

enum FeedRequests {
    static func page(
        _ id: UUID, after: ServerCounter? = nil, before: ServerCounter? = nil,
        limit: Int = 50
    ) throws -> APIRequest {
        guard after == nil || before == nil, (1...100).contains(limit) else {
            throw ClientFailure.invalidRequest
        }
        var query = [URLQueryItem(name: "limit", value: String(limit))]
        if let after { query.append(URLQueryItem(name: "after_sequence", value: after.rawValue)) }
        if let before {
            query.append(URLQueryItem(name: "before_sequence", value: before.rawValue))
        }
        return APIRequest(
            path: ["meetings", id.uuidString.lowercased(), "feed"],
            query: query, meetingID: id, invalidatesMeetingOnForbidden: true)
    }

    static func message(_ id: UUID, text: String, clientRequestID: UUID) throws -> APIRequest {
        try .json(
            path: ["meetings", id.uuidString.lowercased(), "messages"], method: .post,
            body: MessageRequest(text: text, clientRequestID: clientRequestID),
            key: clientRequestID, status: 201, meetingID: id, invalidatesMeetingOnForbidden: true)
    }
}
