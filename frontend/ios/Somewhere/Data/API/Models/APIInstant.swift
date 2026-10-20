import Foundation

struct APIInstant: Codable, Equatable, Sendable {
    let rawValue: String
    let date: Date

    init(_ value: String) throws {
        let fractional = Date.ISO8601FormatStyle(includingFractionalSeconds: true)
        let regular = Date.ISO8601FormatStyle()
        guard let parsed = (try? fractional.parse(value)) ?? (try? regular.parse(value)) else {
            throw ClientFailure.invalidResponse
        }
        rawValue = value
        date = parsed
    }

    init(from decoder: any Decoder) throws {
        try self.init(decoder.singleValueContainer().decode(String.self))
    }

    func encode(to encoder: any Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }
}
