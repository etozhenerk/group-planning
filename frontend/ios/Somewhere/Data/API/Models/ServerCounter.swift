import Foundation

struct ServerCounter: Codable, Hashable, Comparable, Sendable {
    let rawValue: String

    static let zero = ServerCounter(validated: "0")

    init(_ value: String) throws {
        guard !value.isEmpty,
            value.utf8.allSatisfy({ (48...57).contains($0) }),
            value == "0" || !value.hasPrefix("0"),
            value.count < 20 || (value.count == 20 && value <= "18446744073709551615")
        else {
            throw ClientFailure.invalidResponse
        }
        rawValue = value
    }

    private init(validated value: String) {
        rawValue = value
    }

    init(from decoder: any Decoder) throws {
        let value = try decoder.singleValueContainer().decode(String.self)
        try self.init(value)
    }

    func encode(to encoder: any Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }

    static func < (lhs: Self, rhs: Self) -> Bool {
        if lhs.rawValue.count != rhs.rawValue.count {
            return lhs.rawValue.count < rhs.rawValue.count
        }
        return lhs.rawValue < rhs.rawValue
    }
}
