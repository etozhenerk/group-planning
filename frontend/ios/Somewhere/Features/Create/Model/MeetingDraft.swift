import Foundation

struct MeetingDraft: Codable, Equatable, Sendable {
    struct Day: Codable, Equatable, Sendable {
        let year: Int
        let month: Int
        let day: Int
    }
    struct Clock: Codable, Equatable, Sendable {
        let hour: Int
        let minute: Int
    }
    enum Repetition: String, Codable, Sendable { case earlier, later }
    var title = ""
    var description = ""
    var place = ""
    var day: Day?
    var clock: Clock?
    var repetition: Repetition?
    let timezone: String
    var isEmpty: Bool {
        title.isEmpty && description.isEmpty && place.isEmpty && day == nil && clock == nil
    }

    func input() throws -> CreateMeeting {
        let title = title.trimmingCharacters(in: .whitespacesAndNewlines)
        guard (1...120).contains(title.unicodeScalars.count) else { throw DraftIssue.title }
        guard description.unicodeScalars.count <= 4000 else { throw DraftIssue.description }
        guard place.unicodeScalars.count <= 500 else { throw DraftIssue.place }
        guard let day else { throw DraftIssue.day }
        let startsOn = String(format: "%04d-%02d-%02d", day.year, day.month, day.day)
        guard CalendarDate.parse(startsOn) != nil else { throw DraftIssue.day }
        _ = try LocalMeetingTime.zone(timezone)
        if clock == nil {
            return CreateMeeting(
                title: title, description: description.isEmpty ? nil : description,
                startsAt: nil, timezone: timezone, place: place.isEmpty ? nil : place,
                startsOn: startsOn)
        }
        let date = try LocalMeetingTime.resolve(self)
        let zone = try LocalMeetingTime.zone(timezone)
        let format = Date.ISO8601FormatStyle(timeZoneSeparator: .colon, timeZone: zone)
        return CreateMeeting(
            title: title, description: description.isEmpty ? nil : description,
            startsAt: try APIInstant(date.formatted(format)), timezone: timezone,
            place: place.isEmpty ? nil : place)
    }
}

enum DraftIssue: Error, Equatable {
    case title, description, place, day, clock, timezone, nonexistent, ambiguous
    var text: String {
        switch self {
        case .title: "Название должно содержать от 1 до 120 символов."
        case .description: "В описании должно быть не больше 4000 символов."
        case .place: "В названии места должно быть не больше 500 символов."
        case .day: "Выберите дату встречи."
        case .clock: "Укажите время встречи."
        case .timezone: "Не удалось определить часовой пояс."
        case .nonexistent: "В этом часовом поясе такого времени нет. Выберите другое."
        case .ambiguous: "Это время встречается дважды. Выберите ранний или поздний вариант."
        }
    }
}
