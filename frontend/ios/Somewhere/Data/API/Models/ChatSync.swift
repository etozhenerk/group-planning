import Foundation

struct ChatCapabilities: Decodable, Sendable {
    let protocolVersion: Int
    let sync: Bool
    let readState: Bool
    let realtime: Bool

    enum CodingKeys: String, CodingKey {
        case protocolVersion = "protocol_version"
        case sync, realtime
        case readState = "read_state"
    }
}

struct ChatRange: Decodable, Equatable, Sendable {
    let firstSequence: ServerCounter?
    let lastSequence: ServerCounter?

    enum CodingKeys: String, CodingKey {
        case firstSequence = "first_sequence"
        case lastSequence = "last_sequence"
    }
}

struct ChatProjection: Decodable, Sendable {
    let resourceKind: String
    let resourceID: UUID
    let projectionVersion: ServerCounter
    let entry: FeedEntry?
    let datePoll: DatePoll?
    let placePoll: PlacePoll?
    let preparationTask: PreparationTask?
    let reactions: [MessageReactions]?

    enum CodingKeys: String, CodingKey {
        case resourceKind = "resource_kind"
        case resourceID = "resource_id"
        case projectionVersion = "projection_version"
        case entry, reactions
        case datePoll = "date_poll"
        case placePoll = "place_poll"
        case preparationTask = "preparation_task"
    }
}

struct ChatSnapshot: Decodable, Sendable {
    let myReadState: ServerCounter?
    let unreadBaselineSequence: ServerCounter?
    let unreadCount: ServerCounter?
    let firstUnread: UUID?
    let mode: String
    let streamEpoch: UUID
    let changeCursor: String
    let entries: [FeedEntry]
    let projections: [ChatProjection]
    let meeting: ChatMeeting
    let projectionVersion: ServerCounter
    let latestSequence: ServerCounter
    let range: ChatRange
    let hasOlder: Bool
    let hasNewer: Bool

    enum CodingKeys: String, CodingKey {
        case myReadState = "my_read_state"
        case unreadBaselineSequence = "unread_baseline_sequence"
        case unreadCount = "unread_count"
        case firstUnread = "first_unread"
        case mode, entries, projections, meeting, range
        case streamEpoch = "stream_epoch"
        case changeCursor = "change_cursor"
        case projectionVersion = "projection_version"
        case latestSequence = "latest_sequence"
        case hasOlder = "has_older"
        case hasNewer = "has_newer"
    }
}

struct ChatChange: Decodable, Sendable {
    let kind: String
    let entryID: UUID?
    let resourceKind: String?
    let resourceID: UUID?
    let projectionVersion: ServerCounter
    let projection: ChatProjection?

    enum CodingKeys: String, CodingKey {
        case kind, projection
        case entryID = "entry_id"
        case resourceKind = "resource_kind"
        case resourceID = "resource_id"
        case projectionVersion = "projection_version"
    }
}

struct ChatChanges: Decodable, Sendable {
    let myReadState: ServerCounter?
    let unreadBaselineSequence: ServerCounter?
    let unreadCount: ServerCounter?
    let firstUnread: UUID?
    let mode: String
    let streamEpoch: UUID
    let nextCursor: String
    let throughCursor: String
    let hasMore: Bool
    let changes: [ChatChange]
    let meeting: ChatMeeting
    let projectionVersion: ServerCounter

    enum CodingKeys: String, CodingKey {
        case myReadState = "my_read_state"
        case unreadBaselineSequence = "unread_baseline_sequence"
        case unreadCount = "unread_count"
        case firstUnread = "first_unread"
        case mode, changes, meeting
        case streamEpoch = "stream_epoch"
        case nextCursor = "next_cursor"
        case throughCursor = "through_cursor"
        case hasMore = "has_more"
        case projectionVersion = "projection_version"
    }
}

struct ChatMeeting: Decodable, Sendable {
    let id: UUID
    let organizerID: UUID
    let title: String
    let description: String?
    let startsOn: String?
    let startsAt: APIInstant?
    let timezone: String
    let place: String?
    let coverURL: URL?
    let period: String
    let revision: ServerCounter
    let participantCount: Int
    let myRSVP: RSVPAnswer?
    let myRSVPRevision: ServerCounter

    enum CodingKeys: String, CodingKey {
        case id, title, description, timezone, place, period, revision
        case organizerID = "organizer_id"
        case startsOn = "starts_on"
        case startsAt = "starts_at"
        case coverURL = "cover_url"
        case participantCount = "participant_count"
        case myRSVP = "my_rsvp"
        case myRSVPRevision = "my_rsvp_revision"
    }

    func replacing(_ previous: Meeting) throws -> Meeting {
        guard previous.id == id else { throw ClientFailure.invalidResponse }
        return Meeting(
            id: id, title: title, startsAt: startsAt, timezone: timezone, place: place,
            coverURL: coverURL, participantCount: participantCount, revision: revision,
            myRSVP: myRSVP, myRSVPRevision: myRSVPRevision, organizerID: organizerID,
            description: description, createdAt: previous.createdAt, period: period,
            startsOn: startsOn)
    }
}
