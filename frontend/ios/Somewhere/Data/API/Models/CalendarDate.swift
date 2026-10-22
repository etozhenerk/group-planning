import Foundation

// Gregorian civil days use UTC only for arithmetic, never to move an event between time zones.
enum CalendarDate {
    static var calendar: Calendar {
        var value = Calendar(identifier: .gregorian)
        value.timeZone = .gmt
        value.locale = Locale(identifier: "ru_RU")
        return value
    }

    static func parse(_ value: String) -> Date? {
        let parts = value.split(separator: "-", omittingEmptySubsequences: false)
        guard parts.count == 3, value.count == 10,
            let year = Int(parts[0]), let month = Int(parts[1]), let day = Int(parts[2]),
            (1...9999).contains(year),
            let result = calendar.date(from: DateComponents(year: year, month: month, day: day)),
            string(result) == value
        else { return nil }
        return result
    }

    static func string(_ value: Date) -> String {
        let parts = calendar.dateComponents([.year, .month, .day], from: value)
        return String(
            format: "%04d-%02d-%02d", parts.year ?? 1970, parts.month ?? 1, parts.day ?? 1)
    }

    static func today(_ now: Date = Date(), zone: TimeZone = .current) -> String {
        var local = calendar
        local.timeZone = zone
        let parts = local.dateComponents([.year, .month, .day], from: now)
        return String(
            format: "%04d-%02d-%02d", parts.year ?? 1970, parts.month ?? 1, parts.day ?? 1)
    }

    static func adding(_ day: String, component: Calendar.Component, value: Int) -> String {
        guard let start = parse(day),
            let date = calendar.date(byAdding: component, value: value, to: start)
        else { return day }
        return string(date)
    }

    static func days(_ selected: String) -> [String] {
        guard let date = parse(selected),
            let first = calendar.dateInterval(of: .month, for: date)?.start
        else { return [] }
        let offset = (calendar.component(.weekday, from: first) + 5) % 7
        let start = adding(string(first), component: .day, value: -offset)
        return (0..<42).map { adding(start, component: .day, value: $0) }
    }

    static func heading(_ day: String, format: String) -> String {
        let text = label(day, format: format)
        return text.prefix(1).uppercased() + text.dropFirst()
    }

    static func label(_ day: String, format: String) -> String {
        guard let date = parse(day) else { return day }
        let formatter = DateFormatter()
        formatter.calendar = calendar
        formatter.locale = Locale(identifier: "ru_RU")
        formatter.timeZone = .gmt
        formatter.dateFormat = format
        return formatter.string(from: date)
    }

}
