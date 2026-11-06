import SwiftUI

struct ProfileIdentityPanel: View {
    let profile: AccountProfile
    var body: some View {
        HStack(spacing: DesignTokens.spaceS20) {
            ParticipantAvatar(
                user: UserProfile(
                    id: profile.id, displayName: profile.displayName,
                    avatarURL: profile.avatarURL),
                size: DesignTokens.componentMobileProfileAvatarSize,
                color: DesignTokens.colorSurface, foregroundColor: DesignTokens.colorMuted,
                cornerRadius: DesignTokens.componentMobileProfileAvatarRadius)
            VStack(alignment: .leading, spacing: DesignTokens.spaceS8) {
                Text(profile.displayName).designTokenFont(
                    DesignTokens.componentMobileProfileNameSize,
                    weight: DesignTokens.componentMobileServiceTitleWeight, relativeTo: .title
                )
                .tracking(-DesignTokens.componentMobileProfileNameTracking)
                .fixedSize(horizontal: false, vertical: true)
                Text("Вход через Яндекс ID").designFont(DesignTokens.typographySizeCaption)
                    .foregroundStyle(DesignTokens.colorMuted)
            }.frame(maxWidth: .infinity, alignment: .leading)
        }.padding(.top, DesignTokens.componentMobileProfileIdentityTop)
            .padding(.bottom, DesignTokens.componentMobileProfileIdentityBottom)
    }
}
