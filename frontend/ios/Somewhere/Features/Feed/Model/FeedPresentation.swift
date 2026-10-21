import Foundation

enum FeedPresentation {
    static func event(_ entry: FeedEntry) -> String {
        guard entry.payloadVersion == 1 else { return "Событие пока не поддерживается" }
        let name = entry.actor.displayName
        switch entry.kind {
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
