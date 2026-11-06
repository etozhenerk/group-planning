import SwiftUI

struct OnboardingChatFile: View {
    var body: some View {
        HStack(alignment: .bottom, spacing: DesignTokens.spaceS8) {
            Spacer(minLength: DesignTokens.spaceS16)
            VStack(alignment: .leading, spacing: DesignTokens.spaceS8) {
                HStack(spacing: DesignTokens.spaceS12) {
                    ChatIcon(kind: .file)
                    VStack(alignment: .leading, spacing: DesignTokens.spaceS4) {
                        Text("Правила игры.pdf").font(
                            .system(size: DesignTokens.typographySizeSmall))
                        Text("2,3 МБ").font(.system(size: DesignTokens.typographySizeCaption))
                    }
                }
                HStack(spacing: DesignTokens.componentMobileMessageMetadataGap) {
                    Spacer(minLength: DesignTokens.spaceS0)
                    Text("18:43").font(
                        .system(size: DesignTokens.componentMobileMessageMetadataSize))
                    MessageReceiptBadge(count: try? ServerCounter("4"), open: {})
                }.foregroundStyle(DesignTokens.colorMobileMessageOwnMetadata)
            }.padding(DesignTokens.spaceS12)
                .foregroundStyle(DesignTokens.colorOwnText)
                .background(
                    DesignTokens.colorOwnMessage,
                    in: RoundedRectangle(cornerRadius: DesignTokens.radiusCard))
            ParticipantAvatar(
                user: OnboardingExamplePeople.misha,
                size: DesignTokens.componentMobileChatMessageAvatar,
                color: DesignTokens.colorRosterSand, foregroundColor: DesignTokens.colorRosterText)
        }
    }
}
