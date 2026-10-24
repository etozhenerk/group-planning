import Foundation

struct DatePoll: Codable, Equatable, Sendable, Identifiable {
    let id: UUID
    let meetingID: UUID
    let author: UserProfile
    let settings: DatePollSettings
    let options: [DatePollOption]
    let state: String
    let revision: ServerCounter
    let myVoteRevision: ServerCounter
    let myOptionIDs: [UUID]
    let createdAt: APIInstant
    let closesAt: APIInstant
    let closedAt: APIInstant?
    let leaderOptionIDs: [UUID]
    let appliedOptionID: UUID?
    let canVote: Bool
    let canAddOptions: Bool
    let canResolve: Bool

    enum CodingKeys: String, CodingKey {
        case id, author, settings, options, state, revision
        case meetingID = "meeting_id"
        case myVoteRevision = "my_vote_revision"
        case myOptionIDs = "my_option_ids"
        case createdAt = "created_at"
        case closesAt = "closes_at"
        case closedAt = "closed_at"
        case leaderOptionIDs = "leader_option_ids"
        case appliedOptionID = "applied_option_id"
        case canVote = "can_vote"
        case canAddOptions = "can_add_options"
        case canResolve = "can_resolve"
    }
}

struct DatePollSettings: Codable, Equatable, Sendable {
    var multipleAnswers = true
    var allowRevoting = true
    var allowNewOptions = true
    var anonymous = false
    var hideResults = false

    enum CodingKeys: String, CodingKey {
        case multipleAnswers = "multiple_answers"
        case allowRevoting = "allow_revoting"
        case allowNewOptions = "allow_new_options"
        case anonymous
        case hideResults = "hide_results"
    }
}

struct DatePollOption: Codable, Equatable, Sendable, Identifiable {
    let id: UUID
    let date: String
    let votes: Int?
    let voters: [UserProfile]?
}
