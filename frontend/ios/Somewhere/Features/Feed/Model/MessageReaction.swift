import Foundation

struct MessageReaction: Codable, Equatable, Identifiable, Sendable {
    let emoji: String
    var count: Int
    var mine: Bool
    var users: [UserProfile]
    var id: String { emoji }
}
struct MessageReactions: Decodable, Sendable {
    let entryID: UUID
    var reactions: [MessageReaction]
    enum CodingKeys: String, CodingKey {
        case entryID = "entry_id"
        case reactions
    }
}
struct ReactionPage: Decodable, Sendable { let entries: [MessageReactions] }
