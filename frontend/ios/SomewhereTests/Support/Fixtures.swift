import Foundation
import Testing

@testable import Somewhere

struct ContractFixture: Decodable {
    let name: String
    let schema: String
    let body: JSONValue
    var data: Data { get throws { try APICoding.encode(body) } }
}

private final class BundleToken: NSObject {}

enum Fixtures {
    static func all() throws -> [ContractFixture] {
        let url = try #require(
            Bundle(for: BundleToken.self).url(forResource: "cases", withExtension: "json"))
        return try JSONDecoder().decode([ContractFixture].self, from: Data(contentsOf: url))
    }

    static func data(_ name: String) throws -> Data {
        let fixture = try #require(all().first { $0.name == name })
        return try fixture.data
    }

    static func me(name: String = "Лена", id: UUID = UUID()) throws -> Data {
        try APICoding.encode(
            CurrentSession(
                user: UserProfile(id: id, displayName: name),
                expiresAt: APIInstant("2099-01-01T00:00:00Z"), csrfToken: nil))
    }

    static func meeting(_ id: UUID = UUID(), title: String = "Встреча") throws -> Meeting {
        try Meeting(
            id: id, title: title, startsAt: nil, timezone: "Europe/Moscow", place: nil,
            coverURL: nil, participantCount: 1, revision: .zero, myRSVP: nil,
            myRSVPRevision: .zero, organizerID: UUID(), description: "Описание",
            createdAt: APIInstant("2026-10-20T12:00:00Z"))
    }

    static func feed(_ id: UUID) throws -> FeedPage {
        let entry = try APICoding.decode(FeedEntry.self, from: data("late-message-retry"))
        return FeedPage(
            entries: [entry], hasMore: false, meetingRevision: .zero,
            participantCount: 1, myRSVP: .going, myRSVPRevision: .zero,
            latestSequence: entry.sequence)
    }
}
