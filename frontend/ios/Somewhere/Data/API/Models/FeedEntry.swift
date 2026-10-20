import Foundation

struct FeedEntry: Codable, Equatable, Sendable {
    let id: UUID
    let meetingID: UUID
    let sequence: ServerCounter
    let kind: String
    let payloadVersion: Int
    let actor: UserProfile
    let occurredAt: APIInstant
    let payload: [String: JSONValue]
    let clientRequestID: UUID?

    enum CodingKeys: String, CodingKey {
        case id
        case meetingID = "meeting_id"
        case sequence
        case kind
        case payloadVersion = "payload_version"
        case actor
        case occurredAt = "occurred_at"
        case payload
        case clientRequestID = "client_request_id"
    }

    var messageText: String? {
        guard kind == "message", payloadVersion == 1,
            case .string(let text) = payload["text"]
        else {
            return nil
        }
        return text
    }
}
