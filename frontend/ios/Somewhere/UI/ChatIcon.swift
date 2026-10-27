import SwiftUI

/// Exact template SVGs from the approved Telegram chat revision.
struct ChatIcon: View {
    enum Kind: String {
        case photo = "ChatPhoto"
        case file = "ChatFile"
        case keyboard = "ChatKeyboard"
        case info = "ChatInfo"
        case share = "ChatShare"
        case back = "ChatLeft"
        case plus = "ChatPlus"
        case close = "ChatClose"
        case send = "ChatSend"
        case settings = "ChatSettings"
        case search = "ChatSearch"
        case backspace = "ChatBackspace"
        case calendar = "ChatCalendar"
        case pin = "ChatPin"
        case task = "ChatTask"
        case right = "ChatRight"
        case smile = "ComposerSmile"
    }

    let kind: Kind
    var size = DesignTokens.componentMobileChatIconSize

    var body: some View {
        Image(kind.rawValue).resizable().scaledToFit()
            .frame(width: size, height: size).accessibilityHidden(true)
    }
}
