import SwiftUI

enum HomeSection: String, CaseIterable, Identifiable {
    case meetings = "Встречи"
    case invitations = "Приглашения"
    case profile = "Профиль"
    var id: Self { self }
    var symbol: String {
        switch self {
        case .meetings: "calendar"
        case .invitations: "envelope"
        case .profile: "person.crop.circle"
        }
    }
}
