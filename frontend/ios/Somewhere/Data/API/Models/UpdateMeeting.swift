import Foundation

enum FieldPatch<Value: Encodable & Sendable>: Sendable {
    case unchanged
    case value(Value)
    case clear
}

struct UpdateMeeting: Encodable, Sendable {
    let expectedRevision: ServerCounter
    var title: String?
    var startsAt: APIInstant?
    var timezone: String?
    var description: FieldPatch<String> = .unchanged
    var place: FieldPatch<String> = .unchanged

    enum CodingKeys: String, CodingKey {
        case title, timezone, description, place
        case startsAt = "starts_at"
        case expectedRevision = "expected_revision"
    }

    func encode(to encoder: any Encoder) throws {
        var values = encoder.container(keyedBy: CodingKeys.self)
        try values.encode(expectedRevision, forKey: .expectedRevision)
        try values.encodeIfPresent(title, forKey: .title)
        try values.encodeIfPresent(startsAt, forKey: .startsAt)
        try values.encodeIfPresent(timezone, forKey: .timezone)
        try encode(description, key: .description, into: &values)
        try encode(place, key: .place, into: &values)
    }

    private func encode(
        _ patch: FieldPatch<String>, key: CodingKeys,
        into values: inout KeyedEncodingContainer<CodingKeys>
    ) throws {
        switch patch {
        case .unchanged: break
        case .clear: try values.encodeNil(forKey: key)
        case .value(let value): try values.encode(value, forKey: key)
        }
    }
}
