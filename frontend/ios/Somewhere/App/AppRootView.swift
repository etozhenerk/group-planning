import SwiftUI

struct AppRootView: View {
    @State private var runtime = AppRuntime.configured()
    @State private var introductionComplete = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    private var presentedInvitation: Binding<InvitationTarget?> {
        Binding(
            get: { runtime.ready && introductionComplete ? runtime.invitation : nil },
            set: { runtime.invitation = $0 })
    }

    var body: some View {
        Group {
            if !runtime.ready || !introductionComplete {
                LaunchLoadingView()
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
        .animation(
            reduceMotion ? nil : .easeOut(duration: 0.2),
            value: runtime.ready && introductionComplete
        )
        .task {
            do { try await Task.sleep(for: .seconds(BrandMotion.duration)) } catch { return }
            introductionComplete = true
        }
        .task(id: runtime.restoreID) { await runtime.restore() }
        .onOpenURL { runtime.open($0) }
        .sheet(item: presentedInvitation, onDismiss: runtime.invitationDidDismiss) { target in
            NavigationStack {
                if let api = runtime.api {
                    InvitationRouteView(
                        target: target, api: api, session: runtime.session,
                        warning: runtime.linkWarning, close: runtime.closeInvitation)
                } else {
                    StatusView(
                        title: "Сервер ещё не настроен",
                        text:
                            "Приглашение откроется после настройки сервера приложения."
                    )
                    .toolbar {
                        ToolbarItem(placement: .cancellationAction) {
                            Button("Закрыть", action: runtime.closeInvitation)
                        }
                    }
                }
            }.preferredColorScheme(.dark).presentationDragIndicator(.visible)
        }
    }
}
