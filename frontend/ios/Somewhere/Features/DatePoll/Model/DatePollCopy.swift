import Foundation

enum DatePollCopy {
    static func votes(_ count: Int) -> String {
        let last = count % 10
        let teen = (11...14).contains(count % 100)
        let noun =
            !teen && last == 1 ? "голос" : !teen && (2...4).contains(last) ? "голоса" : "голосов"
        return "\(count) \(noun)"
    }

    static func status(_ poll: DatePoll, timezone: String) -> String {
        switch poll.state {
        case "applied": String(localized: "Опрос завершён · дата выбрана")
        case "no_majority": String(localized: "Опрос завершён · без большинства")
        case "cancelled": String(localized: "Опрос завершён")
        case "awaiting_choice": String(localized: "Выбор за организатором")
        case "awaiting_time": String(localized: "Нужно уточнить время")
        case "open":
            String(localized: "До \(PollDeadlineLabel.text(poll.closesAt, timezone: timezone))")
        default: String(localized: "Опрос пока не поддерживается")
        }
    }

    static func error(_ error: any Error) -> String {
        guard case .http(let status, let details) = error as? ClientFailure else {
            return String(localized: "Не удалось получить ответ. Попробуйте ещё раз.")
        }
        if details?.code == "date_poll_active" {
            return String(localized: "В этой встрече уже есть незавершённый опрос даты.")
        }
        if details?.code == "date_poll_closed" { return String(localized: "Опрос уже завершён.") }
        if details?.fieldErrors["date"] == "duplicate" {
            return String(localized: "Такая дата уже есть в опросе.")
        }
        if details?.fieldErrors["closes_at"] != nil {
            return String(localized: "Выберите время окончания позже текущего.")
        }
        if status == 409 {
            return String(localized: "Опрос изменился. Проверьте выбор и повторите.")
        }
        if status == 403 { return String(localized: "Это действие больше недоступно.") }
        return String(localized: "Не удалось сохранить. Проверьте выбранные даты и время.")
    }
}
