import Foundation

enum RSVPLabels {
    static func title(_ answer: RSVPAnswer) -> String {
        switch answer {
        case .going: "Приду"
        case .maybe: "Возможно"
        case .notGoing: "Не смогу"
        }
    }
}
