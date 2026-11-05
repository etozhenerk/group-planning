import SwiftUI

struct InvitationPageHeader: View {
    let session: SessionStore?
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        HStack(spacing: DesignTokens.spaceS8) {
            BrandWordmark(compact: true).dynamicTypeSize(...DynamicTypeSize.xxxLarge)
            Spacer(minLength: DesignTokens.spaceS8)
            if let user = session?.profile {
                ParticipantAvatar(user: user, size: DesignTokens.spaceS32)
            }
            Button {
                dismiss()
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: DesignTokens.componentMobileBackIconSize))
                    .frame(width: DesignTokens.targetIos, height: DesignTokens.targetIos)
                    .contentShape(Rectangle())
            }.buttonStyle(ChatPressStyle()).accessibilityLabel("Закрыть")
        }
        .padding(.horizontal, DesignTokens.spaceS20).padding(.vertical, DesignTokens.spaceS12)
        .background(DesignTokens.colorBackground)
    }
}
