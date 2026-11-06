import SwiftUI

struct ProfileScreen: View {
    let logout: () -> Void
    let logoutBusy: Bool
    let logoutFailure: ClientFailure?
    @State private var owner: ProfileOwner
    @State private var retry = UUID()
    @State private var account = false
    init(
        session: SessionStore, logoutBusy: Bool = false, logoutFailure: ClientFailure? = nil,
        logout: @escaping () -> Void
    ) {
        self.logout = logout
        self.logoutBusy = logoutBusy
        self.logoutFailure = logoutFailure
        _owner = State(initialValue: ProfileOwner(session: session))
    }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
                Text("Профиль").designTokenFont(
                    DesignTokens.componentMobileServiceTitleSize,
                    weight: DesignTokens.componentMobileServiceTitleWeight, relativeTo: .title
                )
                .tracking(-DesignTokens.componentMobileServiceTitleTracking)
                .accessibilityAddTraits(.isHeader)
                if owner.current {
                    if owner.failed {
                        ProfileLoadState(loading: false, retry: { retry = UUID() })
                    } else if let profile = owner.profile {
                        ProfileIdentityPanel(profile: profile)
                        Button {
                            account = true
                        } label: {
                            HStack(spacing: DesignTokens.spaceS12 + DesignTokens.spaceS2) {
                                ExperienceIcon(
                                    kind: .lock, size: DesignTokens.componentMobileProfileMenuIcon
                                )
                                .foregroundStyle(DesignTokens.colorAccent)
                                VStack(alignment: .leading, spacing: DesignTokens.spaceS4) {
                                    Text("Данные аккаунта").designFont(
                                        DesignTokens.componentMobileProfileAccessTitleSize,
                                        weight: .semibold)
                                    Text("Личные данные и контакты · только вам").designFont(
                                        DesignTokens.typographySizeLabel
                                    )
                                    .foregroundStyle(DesignTokens.colorMuted)
                                }
                                Spacer(minLength: DesignTokens.spaceS8)
                                Image(systemName: "chevron.down").font(
                                    .system(
                                        size: DesignTokens.componentMobileFieldIconSize,
                                        weight: .light)
                                )
                                .foregroundStyle(DesignTokens.colorMuted)
                            }.padding(.horizontal, DesignTokens.spaceS16).padding(
                                .vertical, DesignTokens.spaceS20
                            )
                            .background(
                                DesignTokens.colorSurface,
                                in: RoundedRectangle(
                                    cornerRadius: DesignTokens.componentMobileProfileAccessRadius))
                        }.buttonStyle(.plain).accessibilityIdentifier("profile-account-data")
                    } else {
                        ProfileLoadState(loading: true, retry: { retry = UUID() })
                    }
                    ProfileServiceMenu(api: owner.session.api).padding(
                        .top, DesignTokens.componentMobileProfileMenuGap)
                    VStack(alignment: .leading, spacing: DesignTokens.spaceS12) {
                        if logoutFailure != nil {
                            Label(
                                "Не удалось выйти. Попробуйте ещё раз.",
                                systemImage: "exclamationmark.triangle"
                            )
                            .designFont(DesignTokens.typographySizeCaption).foregroundStyle(
                                DesignTokens.colorMuted
                            )
                            .padding(DesignTokens.spaceS12).background(
                                DesignTokens.colorSurface,
                                in: RoundedRectangle(cornerRadius: DesignTokens.radiusControl))
                        }
                        Button(action: logout) {
                            HStack(spacing: DesignTokens.spaceS10) {
                                if logoutBusy {
                                    ProgressView()
                                } else {
                                    Image(systemName: "rectangle.portrait.and.arrow.right").font(
                                        .system(size: DesignTokens.spaceS20))
                                }
                                Text(logoutBusy ? "Выходим…" : "Выйти из аккаунта")
                            }.designFont(DesignTokens.typographySizeSmall).foregroundStyle(
                                DesignTokens.colorMuted
                            )
                            .frame(
                                maxWidth: .infinity,
                                minHeight: DesignTokens.componentMobileServiceActionHeight
                            )
                            .overlay {
                                RoundedRectangle(
                                    cornerRadius: DesignTokens.componentMobileServiceActionRadius
                                )
                                .stroke(
                                    DesignTokens.colorBorderStrong, lineWidth: DesignTokens.spaceS1)
                            }
                        }.buttonStyle(.plain).disabled(logoutBusy)
                    }.padding(.top, DesignTokens.componentMobileProfileLogoutGap)
                }
            }.padding(.horizontal, DesignTokens.spaceS20).padding(
                .top, DesignTokens.componentMobileProfileInsetTop
            )
            .padding(.bottom, DesignTokens.spaceS24).frame(maxWidth: .infinity, alignment: .leading)
        }.background(DesignTokens.colorBackground).task(id: retry) { await owner.load() }
            .accessibilityIdentifier("profile-screen")
            .sheet(isPresented: $account) {
                if owner.current, let profile = owner.profile {
                    ProfileAccountPanel(profile: profile)
                }
            }.onChange(of: owner.current) { _, current in if !current { account = false } }
    }
}
