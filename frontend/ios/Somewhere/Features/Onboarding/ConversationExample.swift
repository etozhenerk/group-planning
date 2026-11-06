import SwiftUI

struct ConversationExample: View {
    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS16) {
            HStack(alignment: .top, spacing: DesignTokens.spaceS8) {
                ParticipantAvatar(
                    user: OnboardingExamplePeople.lena,
                    size: DesignTokens.componentMobileChatMessageAvatar,
                    color: DesignTokens.colorRosterMint,
                    foregroundColor: DesignTokens.colorRosterText)
                VStack(alignment: .leading, spacing: DesignTokens.spaceS8) {
                    Text("Лена · 18:42").font(.system(size: DesignTokens.typographySizeLabel))
                        .foregroundStyle(DesignTokens.colorMuted)
                    Image("OnboardingDinner").resizable().scaledToFill()
                        .frame(height: DesignTokens.componentMobileOnboardingInvitationPhotoHeight)
                        .clipped()
                        .clipShape(RoundedRectangle(cornerRadius: DesignTokens.radiusControl))
                    ReactionChip(
                        reaction: MessageReaction(emoji: "👍", count: 3, mine: true, users: []),
                        updating: false, toggle: {}, showPeople: {})
                }.padding(DesignTokens.spaceS8)
                    .background(
                        DesignTokens.colorMessage,
                        in: RoundedRectangle(cornerRadius: DesignTokens.radiusCard))
            }
            OnboardingChatFile()
        }.frame(maxWidth: DesignTokens.componentMobileOnboardingChatMaximumWidth)
    }
}
