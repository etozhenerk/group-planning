import Foundation

struct OutgoingMessage: Identifiable, Codable, Equatable, Sendable {
    enum Status: String, Codable, Sendable { case queued, sending, uncertain, rejected }
    let id: UUID
    let text: String
    let createdAt: Date
    var status: Status

    func matches(_ entry: FeedEntry, actor: UUID?, meeting: UUID) -> Bool {
        let plainText: Bool
        switch entry.payload["attachments"] {
        case nil, .array([]): plainText = true
        default: plainText = false
        }
        return plainText && entry.clientRequestID == id && entry.actor.id == actor
            && entry.meetingID == meeting && entry.kind == "message" && entry.payloadVersion == 1
            && entry.messageText == text
    }
}
