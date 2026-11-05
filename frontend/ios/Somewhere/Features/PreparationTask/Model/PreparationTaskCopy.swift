import Foundation

enum PreparationTaskCopy {
    static func status(_ task: PreparationTask, user: UUID?) -> String {
        switch task.state {
        case "offered":
            guard let recipient = task.recipient else { return "Кто возьмёт?" }
            return recipient.id == user
                ? "Предложено вам" : String(localized: "Предложено: \(recipient.displayName)")
        case "accepted":
            return task.assignee?.id == user
                ? "Вы выполняете"
                : String(localized: "Исполняет: \(task.assignee?.displayName ?? "участник")")
        case "completed": return String(localized: "Выполнено · \(task.updatedBy.displayName)")
        case "declined": return String(localized: "Отказ · \(task.updatedBy.displayName)")
        case "cancelled": return String(localized: "Отменено · \(task.updatedBy.displayName)")
        default: return "Обновите приложение, чтобы увидеть состояние задачи."
        }
    }

    static func label(_ action: PreparationAction, task: PreparationTask) -> String {
        switch action {
        case .accept: "Взять на себя"
        case .decline: "Отказаться от задачи"
        case .cancel: "Отменить задачу"
        case .complete: "Отметить выполненной"
        }
    }

    static func error(_ error: Error) -> String {
        switch (error as? ClientFailure)?.statusCode {
        case 409: "Задача изменилась. Проверьте её состояние."
        case 422: "Проверьте название и выберите участника из списка."
        default: "Не удалось сохранить действие."
        }
    }
}
