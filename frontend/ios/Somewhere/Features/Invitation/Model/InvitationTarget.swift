import Foundation

enum InvitationTarget: Hashable, Identifiable, Sendable {
    case token(String)
    case meeting(UUID)

    var id: String {
        switch self {
        case .token(let token): "invitation:" + token
        case .meeting(let id): "meeting:" + id.uuidString
        }
    }
}
