import Foundation

enum SupportKind: String, CaseIterable, Identifiable, Encodable {
    case problem, idea, question
    var id: Self { self }
    var title: String {
        switch self {
        case .problem: "Проблема"
        case .idea: "Идея"
        case .question: "Вопрос"
        }
    }
}
