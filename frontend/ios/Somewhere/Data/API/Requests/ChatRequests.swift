import Foundation

enum ChatRequests {
    static let capabilities = APIRequest(path: ["chat-capabilities"])

    static func snapshot(_ id: UUID, aroundEntryID: UUID? = nil) -> APIRequest {
        var query = [URLQueryItem(name: "limit", value: "50")]
        if let aroundEntryID {
            query.append(
                URLQueryItem(name: "around_entry_id", value: aroundEntryID.uuidString.lowercased()))
        }
        return APIRequest(
            path: ["meetings", id.uuidString.lowercased(), "sync"], query: query,
            meetingID: id, invalidatesMeetingOnForbidden: true)
    }

    static func changes(_ id: UUID, cursor: String) throws -> APIRequest {
        guard !cursor.isEmpty else { throw ClientFailure.invalidRequest }
        return APIRequest(
            path: ["meetings", id.uuidString.lowercased(), "sync"],
            query: [
                URLQueryItem(name: "cursor", value: cursor),
                URLQueryItem(name: "limit", value: "100"),
            ],
            meetingID: id, invalidatesMeetingOnForbidden: true)
    }
}
