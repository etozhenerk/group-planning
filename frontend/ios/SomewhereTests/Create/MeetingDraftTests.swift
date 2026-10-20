import Foundation
import Testing

@testable import Somewhere

struct MeetingDraftTests {
    static func filled(zone: String = "Europe/Moscow") -> MeetingDraft {
        var draft = MeetingDraft(timezone: zone)
        draft.title = "  Настолки  "
        draft.day = .init(year: 2026, month: 10, day: 24)
        draft.clock = .init(hour: 19, minute: 0)
        return draft
    }
    @Test func dateAndTimeMustBeChosenAndOffsetIsPreserved() throws {
        var draft = MeetingDraft(timezone: "Europe/Moscow")
        #expect(throws: DraftIssue.title) { try draft.input() }
        draft.title = "Встреча"
        #expect(throws: DraftIssue.day) { try draft.input() }
        draft.day = .init(year: 2026, month: 10, day: 24)
        #expect(throws: DraftIssue.clock) { try draft.input() }
        let input = try Self.filled().input()
        #expect(input.title == "Настолки")
        #expect(input.startsAt.rawValue == "2026-10-24T19:00:00+03:00")
        #expect(input.description == nil && input.place == nil)
    }
    @Test func missingAndRepeatedHoursDoNotMoveSilently() throws {
        var draft = Self.filled(zone: "America/New_York")
        draft.day = .init(year: 2026, month: 3, day: 8)
        draft.clock = .init(hour: 2, minute: 30)
        #expect(throws: DraftIssue.nonexistent) { try draft.input() }
        draft.day = .init(year: 2026, month: 11, day: 1)
        draft.clock = .init(hour: 1, minute: 30)
        #expect(throws: DraftIssue.ambiguous) { try draft.input() }
        draft.repetition = .earlier
        let early = try draft.input()
        draft.repetition = .later
        let late = try draft.input()
        #expect(late.startsAt.date.timeIntervalSince(early.startsAt.date) == 3600)
    }
    @Test func invalidCalendarAndUnicodeScalarLimits() throws {
        var draft = Self.filled()
        draft.day = .init(year: 2026, month: 2, day: 30)
        #expect(throws: DraftIssue.nonexistent) { try draft.input() }
        draft = Self.filled()
        draft.title = String(repeating: "🙂", count: 120)
        #expect(throws: Never.self) { try draft.input() }
        draft.title.append("🙂")
        #expect(throws: DraftIssue.title) { try draft.input() }
        draft = Self.filled(zone: "unknown-zone")
        #expect(throws: DraftIssue.timezone) { try draft.input() }
    }
}
