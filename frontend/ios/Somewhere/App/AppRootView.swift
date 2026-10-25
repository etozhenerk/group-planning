import SwiftUI

struct AppRootView: View {
    @State private var runtime = AppRuntime.configured()
    @State private var introductionComplete = false
    @State private var servicePresented = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    private var presentedInvitation: Binding<InvitationTarget?> {
        Binding(
            get: {
                runtime.ready && introductionComplete && !runtime.confirmDeletion
                    && runtime.session?.pendingDeletion == nil ? runtime.invitation : nil
            },
            set: { runtime.invitation = $0 })
    }

    var body: some View {
        Group {
            if !runtime.ready || !introductionComplete {
                LaunchLoadingView()
            } else if let session = runtime.session, session.status == .authenticated,
                let user = session.profile
            {
                HomeView(
                    session: session, user: user, drafts: runtime.drafts,
                    deleteAccount: { runtime.confirmDeletion = true }
                ).id(user.id)
            } else if runtime.session?.pendingDeletion != nil {
                BrandWordmark()
            } else if let session = runtime.session, session.status == .failed {
                StatusView(
                    title: "Не удалось проверить вход",
                    text: "Проверьте соединение и попробуйте ещё раз.",
                    retry: { runtime.restoreID = UUID() })
            } else {
                OnboardingView(
                    authenticating: runtime.signIn?.busy == true, signIn: runtime.startSignIn
                )
                .overlay(alignment: .topTrailing) {
                    Button {
                        servicePresented = true
                    } label: {
                        Image(systemName: "questionmark.circle").frame(width: 44, height: 44)
                    }.accessibilityLabel("Помощь и документы").padding(.trailing, 16).padding(
                        .top, 4)
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .foregroundStyle(AppPalette.text)
        .background(AppPalette.background.ignoresSafeArea())
        .preferredColorScheme(.dark)
        .environment(\.locale, Locale(identifier: "ru_RU"))
        .environment(\.coverSelectionSource, runtime.coverSelection)
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
        .onContinueUserActivity(NSUserActivityTypeBrowsingWeb) { activity in
            if let url = activity.webpageURL { runtime.open(url) }
        }
        .onChange(of: runtime.signIn?.completedContext) { runtime.completeSignIn() }
        .modifier(
            SignInProblemModifier(signIn: runtime.signIn, active: runtime.invitation == nil)
        )
        .safeAreaInset(edge: .bottom, spacing: 0) {
            if runtime.session?.accountDeleted == true {
                Text("Аккаунт удалён").padding(16).background(
                    AppPalette.surface, in: RoundedRectangle(cornerRadius: 16)
                ).padding(.horizontal, 24).padding(.bottom, 8)
                    .accessibilityAddTraits(.updatesFrequently)
            }
        }
        .sheet(
            isPresented: Binding(
                get: { runtime.confirmDeletion || runtime.session?.pendingDeletion != nil },
                set: {
                    if runtime.session?.pendingDeletion == nil
                        && runtime.session?.deletionBusy != true
                    {
                        runtime.confirmDeletion = $0
                    }
                }
            )
        ) {
            if let session = runtime.session {
                AccountDeletionScreen(
                    session: session, submit: runtime.deleteAccount,
                    cancel: { runtime.confirmDeletion = false }, leave: runtime.leaveDeletion)
            }
        }
        .sheet(isPresented: $servicePresented) {
            if let api = runtime.api {
                NavigationStack {
                    ScrollView { ServiceLinks(api: api, screen: "sign_in").padding(24) }
                        .navigationTitle("somewhere").toolbar {
                            Button("Готово") { servicePresented = false }
                        }
                }
            }
        }
        .sheet(item: presentedInvitation, onDismiss: runtime.invitationDidDismiss) { target in
            NavigationStack {
                if let api = runtime.api {
                    InvitationRouteView(
                        target: target, api: api, session: runtime.session,
                        warning: runtime.linkWarning, close: runtime.closeInvitation,
                        authenticating: runtime.signIn?.busy == true, signIn: runtime.startSignIn)
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
            }
            .modifier(SignInProblemModifier(signIn: runtime.signIn))
            .preferredColorScheme(.dark).presentationDragIndicator(.visible)
        }
    }
}
