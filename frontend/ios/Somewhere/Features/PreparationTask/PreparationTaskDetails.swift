import SwiftUI

struct PreparationTaskDetails: View {
    let owner: PreparationTaskOwner
    let taskID: UUID
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack {
                    Text("Задача").designFont(22, weight: .bold)
                    Spacer()
                    Button {
                        dismiss()
                    } label: {
                        ExperienceIcon(kind: .close).frame(width: 44, height: 44).contentShape(
                            Rectangle())
                    }.accessibilityLabel("Готово")
                }
                if owner.current, let task = owner.task {
                    Text(task.title).designFont(20, weight: .bold)
                    Text(PreparationTaskCopy.status(task, user: owner.session.profile?.id))
                        .designFont(
                            14)
                    PreparationTaskActions(owner: owner, task: task)
                }
                if let problem = owner.problem {
                    Text(problem).designFont(13).foregroundStyle(AppPalette.error)
                        .accessibilityIdentifier("preparation-error")
                    Button("Повторить") {
                        Task {
                            if owner.pending != nil {
                                await owner.retry()
                            } else {
                                await owner.load(taskID)
                            }
                        }
                    }
                    .disabled(owner.busy).frame(minHeight: 44).accessibilityIdentifier(
                        "preparation-retry")
                }
                Spacer(minLength: 0)
            }.padding(20)
        }.background(AppPalette.background).presentationDetents([.medium, .large])
            .onChange(of: owner.current) { _, current in if !current { dismiss() } }
    }
}
