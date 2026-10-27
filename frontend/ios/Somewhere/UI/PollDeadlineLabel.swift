import Foundation

enum PollDeadlineLabel {
    static func text(_ instant: APIInstant, timezone: String) -> String {
        guard let zone = TimeZone(identifier: timezone) else { return instant.rawValue }
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "ru_RU")
        formatter.timeZone = zone
        formatter.dateFormat = "d MMMM, HH:mm"
        return formatter.string(from: instant.date)
    }
}
