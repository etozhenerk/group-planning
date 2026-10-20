import SwiftUI

struct CreateMeetingScreen: View {
    @Bindable var owner: CreationOwner
    let openMeeting: (UUID) -> Void
    @Environment(\.dismiss) private var dismiss
    @ToolbarContentBuilder
    private var closeToolbar: some ToolbarContent {
        ToolbarItem(placement: .cancellationAction) {
            if owner.created == nil {
                Button {
                    owner.requestClose()
                } label: {
                    Label("Закрыть", systemImage: "xmark")
                }
                .disabled(owner.busy)
            }
        }
    }
    private var content: some View {
        Group {
            if let created = owner.created {
                CreationSuccessView(
                    result: created, close: { dismiss() },
                    open: {
                        openMeeting(created.meeting.id)
                        dismiss()
                    })
            } else if !owner.ready {
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
                .navigationTitle(owner.created == nil ? "Новая встреча" : "Готово")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar { closeToolbar }
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
        .onChange(of: owner.dismissed) { _, closed in if closed { dismiss() } }
        .task { await owner.load() }
        .onDisappear { owner.cancel() }
    }
}
