import Foundation

enum LocalMeetingTime {
    static func zone(_ name: String) throws -> TimeZone {
        guard let zone = TimeZone(identifier: name) else { throw DraftIssue.timezone }
        return zone
    }

    static func calendar(_ zone: TimeZone) -> Calendar {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = zone
        calendar.locale = Locale(identifier: "ru_RU")
        return calendar
    }

    static func resolve(_ draft: MeetingDraft) throws -> Date {
        guard let day = draft.day else { throw DraftIssue.day }
        guard let clock = draft.clock else { throw DraftIssue.clock }
        let calendar = calendar(try zone(draft.timezone))
        let parts = DateComponents(
            year: day.year, month: day.month, day: day.day,
            hour: clock.hour, minute: clock.minute, second: 0)
        guard
            let nominal = calendar.date(
                from: DateComponents(year: day.year, month: day.month, day: day.day)),
            let start = calendar.date(byAdding: .day, value: -1, to: nominal),
            let first = calendar.nextDate(
                after: start, matching: parts, matchingPolicy: .strict, repeatedTimePolicy: .first),
            let last = calendar.nextDate(
                after: start, matching: parts, matchingPolicy: .strict, repeatedTimePolicy: .last),
            calendar.dateComponents([.year, .month, .day, .hour, .minute, .second], from: first)
                == parts
        else { throw DraftIssue.nonexistent }
        if first != last {
            guard let choice = draft.repetition else { throw DraftIssue.ambiguous }
            return choice == .earlier ? first : last
        }
        return first
    }

    static func day(_ date: Date, zone: TimeZone) -> MeetingDraft.Day {
        let parts = calendar(zone).dateComponents([.year, .month, .day], from: date)
        return MeetingDraft.Day(
            year: parts.year ?? 1970, month: parts.month ?? 1, day: parts.day ?? 1)
    }

    static func clock(_ date: Date, zone: TimeZone) -> MeetingDraft.Clock {
        let parts = calendar(zone).dateComponents([.hour, .minute], from: date)
        return MeetingDraft.Clock(hour: parts.hour ?? 0, minute: parts.minute ?? 0)
    }
}
