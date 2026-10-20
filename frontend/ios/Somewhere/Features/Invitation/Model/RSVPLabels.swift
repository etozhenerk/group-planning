import Foundation

enum RSVPLabels {
    static func title(_ answer: RSVPAnswer) -> String {
        switch answer {
        case .going: "Приду"
        case .maybe: "Возможно"
        case .notGoing: "Не смогу"
        }
    }
    static func confirmation(_ answer: RSVPAnswer) -> String {
        switch answer {
        case .going: "Вы придёте"
        case .maybe: "Вы пока не уверены"
        case .notGoing: "Вы не сможете прийти"
        }
    }
    static func symbol(_ answer: RSVPAnswer) -> String {
        switch answer {
        case .going: "checkmark"
        case .maybe: "questionmark"
        case .notGoing: "minus"
        }
    }
}
