import SwiftUI

struct ProfileScreen: View {
    let logout: () -> Void
    let deleteAccount: () -> Void
    @State private var owner: ProfileOwner
    @State private var retry = UUID()
    @ScaledMetric(relativeTo: .title) private var titleSize = 28.0
    init(session: SessionStore, logout: @escaping () -> Void, deleteAccount: @escaping () -> Void) {
        self.logout = logout
        self.deleteAccount = deleteAccount
        _owner = State(initialValue: ProfileOwner(session: session))
    }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Text("Мой профиль").font(.system(size: titleSize, weight: .bold)).tracking(-0.9)
                    .accessibilityAddTraits(.isHeader).padding(.bottom, 24)
                if owner.current {
                    if owner.failed {
                        StatusView(title: "Не удалось загрузить профиль", retry: { retry = UUID() })
                    } else if let profile = owner.profile {
                        ProfileIdentityPanel(profile: profile)
                        Text("ЛИЧНЫЕ ДАННЫЕ").designFont(12, weight: .semibold)
                            .tracking(0.9).foregroundStyle(AppPalette.muted)
                            .padding(.top, 22).padding(.bottom, 16)
                        ProfilePersonalPanel(profile: profile)
                        Text("КОНТАКТНЫЕ ДАННЫЕ").designFont(12, weight: .semibold)
                            .tracking(0.9).foregroundStyle(AppPalette.muted)
                            .padding(.top, 22).padding(.bottom, 16)
                        VStack(alignment: .leading, spacing: 18) {
                            ProfileField(title: "Почта", value: profile.email ?? "Не указана")
                            ProfileField(title: "Телефон", value: profile.phone ?? "Не указан")
                            HStack(spacing: 4) {
                                ExperienceIcon(kind: .lock, size: 13)
                                Text("Видны только вам. Получены из Яндекс ID.").fixedSize(
                                    horizontal: false, vertical: true)
                            }.designFont(12).foregroundStyle(AppPalette.muted)
                        }.padding(20).background(
                            AppPalette.surface, in: RoundedRectangle(cornerRadius: 22))
                    } else {
                        VStack(spacing: 22) {
                            RoundedRectangle(cornerRadius: 22).frame(height: 245)
                            RoundedRectangle(cornerRadius: 22).frame(height: 314.5)
                            RoundedRectangle(cornerRadius: 22).frame(height: 182)
                        }.foregroundStyle(AppPalette.surface).accessibilityLabel("Загрузка профиля")
                    }
                    HStack {
                        Spacer()
                        Button("Выйти", action: logout).designFont(14, weight: .semibold)
                            .padding(.horizontal, 18).frame(minHeight: 47)
                            .overlay {
                                RoundedRectangle(cornerRadius: 13).stroke(
                                    .white.opacity(0.125), lineWidth: 1)
                            }
                            .accessibilityLabel("Выйти из аккаунта")
                    }.padding(.top, 20)
                    ServiceLinks(api: owner.session.api, screen: "profile").padding(.top, 40)
                    Button("Удалить аккаунт", role: .destructive, action: deleteAccount)
                        .designFont(13).frame(minHeight: 44).padding(.top, 20)
                }
                Text(AppVersion.shortLabel).designFont(12).foregroundStyle(
                    AppPalette.muted
                ).padding(.top, 12)
            }.padding(.horizontal, 20).padding(.top, 28).padding(.bottom, 100)
                .frame(maxWidth: .infinity, alignment: .leading)
        }.background(AppPalette.background).task(id: retry) { await owner.load() }
            .accessibilityIdentifier("profile-screen")
    }
}
