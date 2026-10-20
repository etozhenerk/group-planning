import Foundation

struct APIErrorEnvelope: Codable, Equatable, Sendable {
    let error: APIProblem

    enum CodingKeys: String, CodingKey {
        case error
    }
}
