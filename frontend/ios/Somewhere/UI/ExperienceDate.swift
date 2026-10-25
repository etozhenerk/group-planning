import Foundation

enum ExperienceDate {
    static func meetingCount(_ count: Int) -> String {
        let rest = count % 100
        let word =
            (11...14).contains(rest)
            ? "встреч"
            : count % 10 == 1 ? "встреча" : (2...4).contains(count % 10) ? "встречи" : "встреч"
        return "\(count) \(word)"
    }

    static func label(
        _ instant: APIInstant?, day: String?, timezone: String, clock: Bool = true,
        weekday: Bool = false
    ) -> String {
        let date = instant?.date ?? day.flatMap(CalendarDate.parse)
        guard let date else { return "Дата пока не выбрана" }
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "ru_RU")
        formatter.timeZone = instant == nil ? .gmt : TimeZone(identifier: timezone)
        formatter.dateFormat =
            (weekday ? "EEE, " : "") + "d MMMM" + (instant != nil && clock ? " · HH:mm" : "")
        let result = formatter.string(from: date)
        return weekday ? result.prefix(1).uppercased() + result.dropFirst() : result
    }
    static func weekend(_ instant: APIInstant?, day: String?, timezone: String) -> Bool {
        guard let date = instant?.date ?? day.flatMap(CalendarDate.parse) else { return false }
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = instant == nil ? .gmt : TimeZone(identifier: timezone) ?? .gmt
        return calendar.isDateInWeekend(date)
    }
    static func participants(_ count: Int) -> String {
        let tail = count % 100
        let word =
            (11...14).contains(tail)
            ? "участников"
            : count % 10 == 1
                ? "участник" : (2...4).contains(count % 10) ? "участника" : "участников"
        return "\(count) " + word
    }
}
