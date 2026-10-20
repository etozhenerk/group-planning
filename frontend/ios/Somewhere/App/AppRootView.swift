import SwiftUI

struct AppRootView: View {
    @State private var runtime = AppRuntime.configured()
    var body: some View {
        Group {
            if !runtime.ready {
                StatusView(title: "Проверяем вход…", loading: true)
            } else if let session = runtime.session, session.status == .authenticated,
                let user = session.profile
            {
                HomeView(session: session, user: user, drafts: runtime.drafts).id(user.id)
            } else if let session = runtime.session, session.status == .failed {
                StatusView(
                    title: "Не удалось проверить вход",
                    text: "Проверьте соединение и попробуйте ещё раз.",
                    retry: { runtime.restoreID = UUID() })
            } else {
                OnboardingView()
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .foregroundStyle(AppPalette.text)
        .background(AppPalette.background.ignoresSafeArea())
        .preferredColorScheme(.dark)
        .environment(\.locale, Locale(identifier: "ru_RU"))
        .task(id: runtime.restoreID) { await runtime.restore() }
    }
}
