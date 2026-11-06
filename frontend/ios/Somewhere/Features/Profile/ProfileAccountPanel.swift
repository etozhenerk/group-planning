import SwiftUI

struct ProfileAccountPanel: View {
    let profile: AccountProfile
    var body: some View {
        ActionFormSheet(
            title: "Данные аккаунта", scrollIdentifier: "profile-account-scroll",
            headerIdentifier: "profile-account-header"
        ) {
            VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
                HStack(spacing: DesignTokens.spaceS8) {
                    Image(systemName: "lock").font(.system(size: DesignTokens.spaceS16))
                    Text("Эти данные видны только вам")
                }.designFont(DesignTokens.typographySizeCaption).foregroundStyle(
                    DesignTokens.colorAccent
                )
                .padding(.top, DesignTokens.spaceS2).padding(.bottom, DesignTokens.spaceS8)
                Text("Получены из Яндекс ID").designFont(DesignTokens.typographySizeCaption)
                    .foregroundStyle(DesignTokens.colorMuted).padding(.bottom, DesignTokens.spaceS4)
                heading("Контакты")
                ProfilePersonalRow(title: "Почта", value: profile.email ?? "Не указана")
                ProfilePersonalRow(
                    title: "Телефон", value: profile.phone ?? "Не указан", last: true)
                heading("Личные данные")
                ProfilePersonalPanel(profile: profile)
            }.padding(.bottom, DesignTokens.spaceS12)
        }
    }
    private func heading(_ title: String) -> some View {
        Text(title).designFont(DesignTokens.typographySizeCaption, weight: .semibold)
            .foregroundStyle(DesignTokens.colorMuted).accessibilityAddTraits(.isHeader)
            .padding(.top, DesignTokens.spaceS24).padding(.bottom, DesignTokens.spaceS2)
    }
}
