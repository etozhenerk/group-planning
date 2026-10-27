import Foundation

struct ChatReadState: Decodable, Sendable {
    let readThroughSequence: ServerCounter
    let unreadBaselineSequence: ServerCounter
    let unreadCount: ServerCounter
    let firstUnread: UUID?
    let projectionVersion: ServerCounter
    enum CodingKeys: String, CodingKey {
        case readThroughSequence = "read_through_sequence"
        case unreadBaselineSequence = "unread_baseline_sequence"
        case unreadCount = "unread_count"
        case firstUnread = "first_unread"
        case projectionVersion = "projection_version"
    }
}

struct ChatReceipt: Decodable, Sendable {
    let entryID: UUID
    let readerCount: ServerCounter
    enum CodingKeys: String, CodingKey {
        case entryID = "entry_id"
        case readerCount = "reader_count"
    }
}

struct ChatReceiptPage: Decodable, Sendable {
    let receipts: [ChatReceipt]
    let projectionVersion: ServerCounter
    enum CodingKeys: String, CodingKey {
        case receipts
        case projectionVersion = "projection_version"
    }
}

struct ChatReaderPage: Decodable, Sendable {
    let readers: [UserProfile]
    let readerCount: ServerCounter
    let nextCursor: String?
    let projectionVersion: ServerCounter
    enum CodingKeys: String, CodingKey {
        case readers
        case readerCount = "reader_count"
        case nextCursor = "next_cursor"
        case projectionVersion = "projection_version"
    }
}
