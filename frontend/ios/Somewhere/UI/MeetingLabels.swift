import Foundation

enum MeetingLabels {
    static func time(_ instant: APIInstant?, timezone: String) -> String {
        guard let instant else { return "Дата ещё выбирается" }
        guard let zone = TimeZone(identifier: timezone) else { return instant.rawValue }
        var style = Date.FormatStyle(date: .abbreviated, time: .shortened).locale(
            Locale(identifier: "ru_RU"))
        style.timeZone = zone
        return instant.date.formatted(style)
    }
    static func clock(_ instant: APIInstant?, timezone: String) -> String {
        guard let instant, let zone = TimeZone(identifier: timezone) else { return "Без даты" }
        var style = Date.FormatStyle(date: .omitted, time: .shortened).locale(
            Locale(identifier: "ru_RU"))
        style.timeZone = zone
        return instant.date.formatted(style)
    }

    static func day(_ day: MeetingDraft.Day?) -> String {
        guard let day else { return "Выбрать дату" }
        return String(format: "%02d.%02d.%04d", day.day, day.month, day.year)
    }
    static func clock(_ clock: MeetingDraft.Clock?) -> String {
        guard let clock else { return "Указать время" }
        return String(format: "%02d:%02d", clock.hour, clock.minute)
    }
}
