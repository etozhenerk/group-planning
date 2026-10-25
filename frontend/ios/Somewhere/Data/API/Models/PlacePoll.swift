import Foundation

struct PlacePoll: Codable, Equatable, Sendable, Identifiable {
    let id: UUID
    let meetingID: UUID
    let author: UserProfile
    let place: String
    var explanation: String? = nil
    let previousPlace: String?
    let state: String
    let revision: ServerCounter
    let myVoteRevision: ServerCounter
    let myVote: String?
    let votesFor: Int
    let votesAgainst: Int
    let createdAt: APIInstant
    let closesAt: APIInstant
    let closedAt: APIInstant?
    let canVote: Bool

    enum CodingKeys: String, CodingKey {
        case id, author, place, explanation, state, revision
        case meetingID = "meeting_id"
        case previousPlace = "previous_place"
        case myVoteRevision = "my_vote_revision"
        case myVote = "my_vote"
        case votesFor = "votes_for"
        case votesAgainst = "votes_against"
        case createdAt = "created_at"
        case closesAt = "closes_at"
        case closedAt = "closed_at"
        case canVote = "can_vote"
    }
}
