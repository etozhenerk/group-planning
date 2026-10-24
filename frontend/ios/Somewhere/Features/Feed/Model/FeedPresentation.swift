import Foundation

enum FeedPresentation {
    static func event(_ entry: FeedEntry) -> String {
        guard entry.payloadVersion == 1 else { return "Событие пока не поддерживается" }
        let name = entry.actor.displayName
        switch entry.kind {
        case "place_poll_cancelled":
            return "Опрос отменён: организатор изменил место."
        case "place_poll_result":
            guard case .string(let state) = entry.payload["state"],
                ["applied", "rejected"].contains(state)
            else {
                return "Событие пока не поддерживается"
            }
            return state == "applied"
                ? "Большинство выбрало новое место." : "Место осталось прежним."
        case "meeting_time_unspecified":
            return "Осталось договориться, во сколько встречаемся."
        case "date_poll_no_majority":
            return "Ни одна дата не набрала большинства. Пока оставляем прежнюю."
        case "date_poll_choice_required":
            return "Несколько дат набрали одинаковое большинство. Выбор за организатором."
        case "date_poll_time_required":
            return "Дату выбрали. Из-за перевода часов нужно уточнить время встречи."
        case "date_poll_cancelled":
            return "Организатор изменил дату встречи. Предыдущий опрос завершён."
        case "date_poll_applied":
            guard case .object(let current) = entry.payload["current"],
                case .string(let day) = current["starts_on"]
            else {
                return "Дату встречи выбрали."
            }
            let label = CalendarDate.label(day, format: "d MMMM")
            if case .object(let previous) = entry.payload["previous"],
                previous["starts_on"] == current["starts_on"]
            {
                return String(localized: "Дату подтвердили: встречаемся \(label).")
            }
            return String(
                localized: "Встреча перенесена на \(label) — эту дату выбрало большинство.")
        case "meeting_created": return name + " создаёт встречу"
        case "participant_joined": return name + " присоединяется к встрече"
        case "participant_left", "rsvp_changed":
            guard case .string(let answer) = entry.payload["answer"],
                let value = RSVPAnswer(rawValue: answer)
            else {
                return "Событие пока не поддерживается"
            }
            return name + ": «" + RSVPLabels.title(value) + "»"
        case "meeting_updated":
            guard case .object(let before) = entry.payload["previous"],
                case .object(let after) = entry.payload["current"]
            else { return name + " меняет настройки встречи" }
            let labels = [
                ("title", "Название"), ("description", "Описание"), ("starts_at", "Дата и время"),
                ("timezone", "Часовой пояс"), ("place", "Место"),
            ]
            let changes = labels.compactMap { key, label -> String? in
                if key == "starts_at" {
                    guard before[key] != after[key] || before["starts_on"] != after["starts_on"]
                    else { return nil }
                    let instant: APIInstant? =
                        if case .string(let raw) = after[key] { try? APIInstant(raw) } else { nil }
                    let day: String? =
                        if case .string(let raw) = after["starts_on"] { raw } else { nil }
                    let zone: String =
                        if case .string(let raw) = after["timezone"] { raw } else { "UTC" }
                    return label + ": " + MeetingLabels.time(instant, timezone: zone, startsOn: day)
                }
                guard before[key] != after[key] else { return nil }
                guard case .string(let value) = after[key], !value.isEmpty else {
                    return label + ": убрано"
                }
                if key == "starts_at", let instant = try? APIInstant(value),
                    case .string(let zone) = after["timezone"]
                {
                    return label + ": " + MeetingLabels.time(instant, timezone: zone)
                }
                return label + ": " + value
            }
            return ([name + " меняет настройки встречи"] + changes).joined(separator: "\n")
        default: return "Событие пока не поддерживается"
        }
    }
    static func time(_ date: Date) -> String {
        date.formatted(.dateTime.hour().minute().locale(Locale(identifier: "ru_RU")))
    }
    static func date(_ date: Date) -> String {
        date.formatted(.dateTime.day().month(.wide).year().locale(Locale(identifier: "ru_RU")))
    }
}
