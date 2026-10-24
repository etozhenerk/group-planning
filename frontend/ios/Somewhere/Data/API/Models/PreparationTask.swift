import Foundation

struct PreparationTask: Codable, Equatable, Sendable, Identifiable {
    let id: UUID
    let meetingID: UUID
    let title: String
    let author: UserProfile
    let recipient: UserProfile?
    let assignee: UserProfile?
    let updatedBy: UserProfile
    let state: String
    let revision: ServerCounter
    let createdAt: APIInstant
    let updatedAt: APIInstant
    let canAccept: Bool
    let canDecline: Bool
    let canCancel: Bool
    let canComplete: Bool

    enum CodingKeys: String, CodingKey {
        case id, title, author, recipient, assignee, state, revision
        case meetingID = "meeting_id"
        case updatedBy = "updated_by"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case canAccept = "can_accept"
        case canDecline = "can_decline"
        case canCancel = "can_cancel"
        case canComplete = "can_complete"
    }
}
