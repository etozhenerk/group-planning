import Foundation

enum InvitationTarget: Hashable, Identifiable, Sendable {
    case token(String)
    case meeting(UUID, publicToken: String? = nil)

    var id: String {
        switch self {
        case .token(let token): "invitation:" + token
        case .meeting(let id, _): "meeting:" + id.uuidString
        }
    }
}
