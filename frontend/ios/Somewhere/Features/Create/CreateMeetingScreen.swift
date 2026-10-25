import SwiftUI

struct CreateMeetingScreen: View {
    @Bindable var owner: CreationOwner
    let openMeeting: (UUID) -> Void
    @Environment(\.dismiss) private var dismiss
    private var content: some View {
        Group {
            if !owner.ready {
                if let problem = owner.problem {
                    StatusView(title: problem, retry: { owner.retryLoad() })
                } else {
                    StatusView(title: "Открываем форму…", loading: true)
                }
            } else {
                CreationFormView(owner: owner)
            }
        }
    }
    var body: some View {
        NavigationStack {
            content
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(AppPalette.background)
                .toolbar(.hidden, for: .navigationBar)
                .safeAreaInset(edge: .top, spacing: 0) { ServicePageHeader() }

        }
        .foregroundStyle(AppPalette.text).tint(AppPalette.accent).preferredColorScheme(.dark)
        .interactiveDismissDisabled(!owner.value.isEmpty || owner.busy)
        .alert("Выйти из формы?", isPresented: $owner.confirmDiscard) {
            Button("Выйти", role: .destructive, action: owner.close)
            Button("Продолжить редактирование", role: .cancel) {}
        } message: {
            Text("Встреча ещё не создана.")
        }
        .alert("Не удалось сохранить черновик", isPresented: $owner.closeFailed) {
            Button("Остаться", role: .cancel) {}
            Button("Выйти без сохранения", role: .destructive, action: owner.forceClose)
        } message: {
            Text("При закрытии формы последние изменения могут потеряться.")
        }
        .onChange(of: owner.created?.meeting.id) { _, id in
            if let id {
                dismiss()
                openMeeting(id)
            }
        }
        .onChange(of: owner.dismissed) { _, closed in
            if closed {
                dismiss()
            }
        }
        .task { await owner.load() }
        .onDisappear { owner.cancel() }
    }
}
