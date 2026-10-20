import Foundation

struct RSVPRequest: Codable, Equatable, Sendable {
    let answer: RSVPAnswer
    let expectedRevision: ServerCounter

    enum CodingKeys: String, CodingKey {
        case answer
        case expectedRevision = "expected_revision"
    }
}
