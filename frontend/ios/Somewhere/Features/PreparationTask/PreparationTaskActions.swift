import SwiftUI

struct PreparationTaskActions: View {
    let owner: PreparationTaskOwner
    let task: PreparationTask

    var body: some View {
        VStack(spacing: 8) {
            ForEach([PreparationAction.accept, .complete, .decline, .cancel], id: \.rawValue) {
                action in
                if action.allowed(task) {
                    let label = PreparationTaskCopy.label(action, task: task)
                    Button {
                        Task { await owner.act(action) }
                    } label: {
                        Text(label).frame(maxWidth: .infinity).frame(minHeight: 32)
                            .opacity(owner.busy && owner.sendingAction == action ? 0 : 1)
                            .overlay {
                                if owner.busy && owner.sendingAction == action { ProgressView() }
                            }
                    }.buttonStyle(.bordered).tint(.primary)
                        .disabled(!owner.editable)
                        .accessibilityLabel(label)
                        .accessibilityIdentifier("preparation-\(action.rawValue)")
                }
            }
        }
    }
}
