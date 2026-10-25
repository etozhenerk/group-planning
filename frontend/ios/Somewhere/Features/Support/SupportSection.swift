enum SupportSection: String, CaseIterable, Identifiable {
    case meetings, calendar, invitation
    case meetingChat = "meeting_chat"
    case profile, memories
    case signIn = "sign_in"
    case other
    var id: String { rawValue }
    var title: String {
        switch self {
        case .meetings: "Мои встречи"
        case .calendar: "Календарь"
        case .invitation: "Приглашение"
        case .meetingChat: "Чат встречи"
        case .profile: "Профиль"
        case .memories: "Вайб встречи"
        case .signIn: "Вход"
        case .other: "Другое"
        }
    }
}
