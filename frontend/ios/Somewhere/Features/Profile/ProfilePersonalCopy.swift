import Foundation

enum ProfilePersonalCopy {
    static func value(_ value: String?) -> String {
        guard let text = value?.trimmingCharacters(in: .whitespacesAndNewlines), !text.isEmpty
        else {
            return "Не указано"
        }
        return text
    }

    static func sex(_ value: String?) -> String {
        switch value {
        case "male": "Мужской"
        case "female": "Женский"
        default: "Не указано"
        }
    }

    static func birthday(_ value: String?) -> String {
        guard let value else { return "Не указано" }
        let parts = value.split(separator: "-", omittingEmptySubsequences: false)
        guard parts.count == 3, parts[0].count == 4, parts[1].count == 2, parts[2].count == 2,
            parts.allSatisfy({ $0.utf8.allSatisfy { (48...57).contains($0) } }),
            let year = Int(parts[0]), let month = Int(parts[1]), let day = Int(parts[2]),
            (0...12).contains(month), (0...31).contains(day)
        else { return "Не указано" }
        let standalone = [
            "январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь",
            "октябрь", "ноябрь", "декабрь",
        ]
        let genitive = [
            "января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября",
            "октября", "ноября", "декабря",
        ]
        if month > 0, day > 0 {
            var calendar = Calendar(identifier: .gregorian)
            calendar.timeZone = .gmt
            let validationYear = year == 0 ? 2000 : year
            let components = DateComponents(year: validationYear, month: month, day: day)
            guard let date = calendar.date(from: components),
                calendar.component(.day, from: date) == day,
                calendar.component(.month, from: date) == month
            else { return "Не указано" }
            return "\(day) \(genitive[month - 1])" + (year > 0 ? " \(year)" : "")
        }
        if month > 0 {
            return standalone[month - 1] + (year > 0 ? " \(year)" : "")
        }
        if day > 0 { return "\(day) число" + (year > 0 ? ", \(year)" : "") }
        return year > 0 ? String(year) : "Не указано"
    }
}
