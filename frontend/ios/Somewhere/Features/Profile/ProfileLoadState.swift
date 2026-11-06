import SwiftUI

struct ProfileLoadState: View {
    let loading: Bool
    let retry: () -> Void
    var body: some View {
        if loading {
            HStack(alignment: .top, spacing: DesignTokens.spaceS20) {
                RoundedRectangle(cornerRadius: DesignTokens.componentMobileProfileAvatarRadius)
                    .frame(
                        width: DesignTokens.componentMobileProfileAvatarSize,
                        height: DesignTokens.componentMobileProfileAvatarSize)
                VStack(alignment: .leading, spacing: DesignTokens.spaceS12) {
                    RoundedRectangle(cornerRadius: DesignTokens.spaceS6).frame(
                        height: DesignTokens.spaceS16 + DesignTokens.spaceS2)
                    RoundedRectangle(cornerRadius: DesignTokens.spaceS6).frame(
                        height: DesignTokens.spaceS12
                    )
                    .padding(.trailing, DesignTokens.spaceS20)
                }.padding(.top, DesignTokens.spaceS20)
            }.foregroundStyle(DesignTokens.colorSurface)
                .padding(.top, DesignTokens.componentMobileProfileIdentityTop)
                .padding(.bottom, DesignTokens.componentMobileProfileIdentityBottom)
                .accessibilityLabel("Загружаем профиль")
        } else {
            VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
                Image(systemName: "person").font(
                    .system(size: DesignTokens.componentMobileProfileErrorIcon)
                )
                .foregroundStyle(DesignTokens.colorAccent).padding(
                    .bottom, DesignTokens.spaceS16 + DesignTokens.spaceS2)
                Text("Профиль не загрузился").designFont(
                    DesignTokens.componentMobileServiceSectionTitleSize, weight: .semibold
                )
                .padding(.bottom, DesignTokens.spaceS8)
                Text("Повторите попытку, чтобы увидеть данные аккаунта.").designFont(
                    DesignTokens.typographySizeSmall
                )
                .foregroundStyle(DesignTokens.colorMuted).frame(
                    maxWidth: DesignTokens.componentMobileProfileErrorBodyMaximumWidth,
                    alignment: .leading
                )
                .padding(.bottom, DesignTokens.spaceS16 + DesignTokens.spaceS2)
                Button(action: retry) {
                    Label("Повторить", systemImage: "arrow.clockwise").designFont(
                        DesignTokens.typographySizeSmall
                    )
                    .foregroundStyle(DesignTokens.colorActionText)
                    .padding(.horizontal, DesignTokens.spaceS12 + DesignTokens.spaceS2)
                    .frame(minHeight: DesignTokens.targetIos).background(
                        DesignTokens.colorAction,
                        in: RoundedRectangle(cornerRadius: DesignTokens.radiusControl))
                }.buttonStyle(.plain)
            }.padding(DesignTokens.spaceS24).frame(maxWidth: .infinity, alignment: .leading)
                .background(
                    DesignTokens.colorSurface,
                    in: RoundedRectangle(cornerRadius: DesignTokens.spaceS20)
                )
                .padding(.top, DesignTokens.componentMobileProfileMenuGap).padding(
                    .bottom, DesignTokens.spaceS12)
        }
    }
}
