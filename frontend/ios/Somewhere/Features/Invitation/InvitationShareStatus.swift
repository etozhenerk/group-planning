import SwiftUI

struct InvitationShareStatus: View {
    let failed: Bool
    let retry: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS12) {
            if failed {
                Text("Не удалось получить ссылку приглашения")
                    .designFont(DesignTokens.typographySizeCaption)
                    .foregroundStyle(DesignTokens.colorError)
                Button(action: retry) {
                    Label("Попробовать ещё раз", systemImage: "arrow.clockwise")
                        .designFont(DesignTokens.typographySizeButton)
                        .foregroundStyle(DesignTokens.colorText)
                        .frame(maxWidth: .infinity, minHeight: DesignTokens.targetIos)
                        .contentShape(Rectangle())
                }.buttonStyle(ChatPressStyle()).accessibilityIdentifier("invitation-share-retry")
            } else {
                ProgressView("Получаем ссылку…")
                    .designFont(DesignTokens.typographySizeCaption)
                    .tint(DesignTokens.colorMuted)
            }
        }.padding(.vertical, DesignTokens.spaceS12)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}
