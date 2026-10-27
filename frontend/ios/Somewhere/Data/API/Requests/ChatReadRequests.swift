import Foundation

enum ChatReadRequests {
    static func marker(_ meeting: UUID, through: ServerCounter) throws -> APIRequest {
        struct Body: Encodable {
            let readThroughSequence: ServerCounter
            enum CodingKeys: String, CodingKey {
                case readThroughSequence = "read_through_sequence"
            }
        }
        return try .json(
            path: ["meetings", meeting.uuidString.lowercased(), "read-marker"],
            method: .put, body: Body(readThroughSequence: through), meetingID: meeting,
            invalidatesMeetingOnForbidden: true)
    }
    static func receipts(_ meeting: UUID, entries: [UUID]) throws -> APIRequest {
        guard entries.count <= 100 else { throw ClientFailure.invalidRequest }
        struct Body: Encodable {
            let entryIDs: [String]
            enum CodingKeys: String, CodingKey { case entryIDs = "entry_ids" }
        }
        return try .json(
            path: ["meetings", meeting.uuidString.lowercased(), "read-receipts", "query"],
            method: .post, body: Body(entryIDs: entries.map { $0.uuidString.lowercased() }),
            meetingID: meeting,
            invalidatesMeetingOnForbidden: true)
    }
    static func readers(_ meeting: UUID, entry: UUID, cursor: String?) -> APIRequest {
        var query = [URLQueryItem(name: "limit", value: "50")]
        if let cursor { query.append(URLQueryItem(name: "cursor", value: cursor)) }
        return APIRequest(
            path: [
                "meetings", meeting.uuidString.lowercased(), "messages",
                entry.uuidString.lowercased(), "readers",
            ], query: query, meetingID: meeting,
            invalidatesMeetingOnForbidden: true)
    }
}
