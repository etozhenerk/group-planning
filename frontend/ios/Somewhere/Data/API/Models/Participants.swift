import Foundation

struct Participants: Codable, Equatable, Sendable {
    let participants: [Participant]

    enum CodingKeys: String, CodingKey {
        case participants
    }
}
