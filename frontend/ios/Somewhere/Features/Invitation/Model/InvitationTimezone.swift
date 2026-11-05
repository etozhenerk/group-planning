import Foundation

enum InvitationTimezone {
    static func label(_ identifier: String) -> String {
        guard identifier != "UTC" else { return identifier }
        return TimeZone(identifier: identifier)?.localizedName(
            for: .shortGeneric, locale: Locale(identifier: "ru_RU")) ?? identifier
    }
}
