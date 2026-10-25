import Foundation

enum ConversationPanel: Equatable {
    case actions
    case emoji
    case reaction(UUID)
}
