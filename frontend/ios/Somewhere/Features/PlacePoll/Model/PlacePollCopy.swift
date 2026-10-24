import Foundation

enum PlacePollCopy {
    static func status(_ poll: PlacePoll, timezone: String) -> String {
        switch poll.state {
        case "applied": "Место изменено"
        case "rejected": "Место осталось прежним"
        case "cancelled": "Опрос отменён: организатор изменил место"
        case "open":
            !poll.canVote || poll.closesAt.date <= Date()
                ? "Голосование завершено"
                : "До \(MeetingLabels.time(poll.closesAt, timezone: timezone))"
        default: "Опрос пока не поддерживается"
        }
    }

    static func error(_ error: any Error) -> String {
        guard case .http(let status, let details) = error as? ClientFailure else {
            return "Не удалось сохранить. Попробуйте ещё раз."
        }
        if details?.code == "place_poll_active" {
            return "Во встрече уже есть открытый опрос о месте."
        }
        if details?.code == "place_poll_closed" { return "Голосование уже завершено." }
        if details?.fieldErrors["place"] == "unchanged" { return "Предложите другое место." }
        if details?.fieldErrors["place"] != nil {
            return "Введите новое место: от 1 до 500 символов."
        }
        if details?.fieldErrors["closes_at"] != nil {
            return "Выберите время окончания позже текущего."
        }
        if status == 409 { return "Ваш голос изменился. Выберите ответ ещё раз." }
        return "Не удалось сохранить. Проверьте введённые данные."
    }
}
