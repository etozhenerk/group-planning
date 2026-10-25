import Foundation

enum CoverIssue: Error, Sendable {
    case unreadable, tooLarge

    var text: String {
        switch self {
        case .unreadable: "Не удалось открыть фото. Выберите другое."
        case .tooLarge: "Фото слишком большое. Выберите другое."
        }
    }
}
