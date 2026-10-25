import Foundation

enum MeetingCardDate {
    static func date(_ meeting: MeetingSummary) -> Date? {
        if let value = meeting.startsAt?.date { return value }
        guard let day = meeting.startsOn else { return nil }
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone(identifier: meeting.timezone)
        return formatter.date(from: day)
    }
    static func weekend(_ meeting: MeetingSummary) -> Bool {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: meeting.timezone) ?? .current
        return date(meeting).map { calendar.isDateInWeekend($0) } ?? false
    }
    static func badge(_ meeting: MeetingSummary) -> String {
        guard let date = date(meeting) else { return "Дата пока не выбрана" }
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "ru_RU")
        formatter.timeZone = TimeZone(identifier: meeting.timezone)
        formatter.dateFormat = meeting.startsAt == nil ? "EEE, d MMMM" : "EEE, d MMMM · HH:mm"
        let value = formatter.string(from: date)
        return value.prefix(1).uppercased() + value.dropFirst()
    }
    static func month(_ meeting: MeetingSummary) -> String {
        guard let date = date(meeting) else { return "Без даты" }
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "ru_RU")
        formatter.timeZone = TimeZone(identifier: meeting.timezone)
        formatter.dateFormat = "LLLL"
        return formatter.string(from: date).uppercased()
    }
}
