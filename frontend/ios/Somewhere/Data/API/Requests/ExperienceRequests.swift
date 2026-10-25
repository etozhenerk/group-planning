import Foundation

/// All private binary requests are reconstructed on the configured API origin.
/// A server URL or an attachment URL can never redirect a bearer to another host.
enum ExperienceRequests {
    static let profile = APIRequest(path: ["me", "profile"])

    static func meeting(_ id: UUID, _ components: [String]) -> APIRequest {
        APIRequest(
            path: ["meetings", id.uuidString.lowercased()] + components,
            meetingID: id, invalidatesMeetingOnForbidden: true)
    }

    static func content(_ media: MeetingMedia) -> APIRequest {
        meeting(media.meetingID, ["media", media.id.uuidString.lowercased(), "content"])
    }

    static func memories(_ id: UUID, cursor: String? = nil) -> APIRequest {
        var request = meeting(id, ["memories"])
        request.query = [URLQueryItem(name: "limit", value: "50")]
        if let cursor { request.query.append(URLQueryItem(name: "cursor", value: cursor)) }
        return request
    }

    static func prepare(_ id: UUID, file: PendingMedia, purpose: String) throws -> APIRequest {
        struct Input: Encodable {
            let clientRequestID: String
            let fileName: String
            let contentType: String
            let sizeBytes: Int
            let purpose: String
            enum CodingKeys: String, CodingKey {
                case clientRequestID = "client_request_id"
                case fileName = "file_name"
                case contentType = "content_type"
                case sizeBytes = "size_bytes"
                case purpose
            }
        }
        return try .json(
            path: meeting(id, ["media", "uploads"]).path, method: .post,
            body: Input(
                clientRequestID: file.id.uuidString.lowercased(), fileName: file.name,
                contentType: file.contentType, sizeBytes: file.data.count, purpose: purpose),
            key: file.id, status: 201, meetingID: id, invalidatesMeetingOnForbidden: true)
    }

    static func upload(_ media: MeetingMedia, data: Data) -> APIRequest {
        var request = content(media)
        request.method = .put
        request.body = data
        request.contentType = media.contentType
        return request
    }

    static func publish(_ media: MeetingMedia, key: UUID, caption: String = "") throws -> APIRequest
    {
        let body = media.kind == "file" && !caption.isEmpty ? ["caption": caption] : [:]
        return try .json(
            path: meeting(
                media.meetingID,
                ["media", media.id.uuidString.lowercased(), "publish"]
            ).path,
            method: .post, body: body, key: key, meetingID: media.meetingID,
            invalidatesMeetingOnForbidden: true)
    }
}
