import Foundation

enum PreparationTaskEvent {
    static func text(_ entry: FeedEntry) -> String? {
        let labels = [
            "preparation_task_created": "Предложение задачи",
            "preparation_task_accepted": "Задача принята",
            "preparation_task_declined": "Отказ от задачи",
            "preparation_task_cancelled": "Задача отменена",
            "preparation_task_completed": "Задача выполнена",
        ]
        guard entry.payloadVersion == 1, let label = labels[entry.kind],
            case .string(let title) = entry.payload["title"]
        else { return nil }
        return String(localized: "\(label) · \(entry.actor.displayName) · «\(title)»")
    }
}
