import SwiftUI

struct CreationFormView: View {
    let owner: CreationOwner
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                CreationFieldsView(owner: owner)
                if let problem = owner.problem {
                    Text(problem).foregroundStyle(AppPalette.error).accessibilityIdentifier(
                        "create-problem")
                }
                if let warning = owner.draftWarning {
                    Text(warning).foregroundStyle(AppPalette.error)
                }
                ActionButton(
                    title: owner.busy
                        ? "Сохраняем…" : owner.frozen ? "Повторить сохранение" : "Создать встречу",
                    disabled: owner.busy, action: owner.startSubmit
                )
                .accessibilityIdentifier("create-submit")
                if owner.busy {
                    ProgressView().tint(AppPalette.accent).accessibilityLabel("Сохраняем встречу")
                }
                Text("После создания появится ссылка для друзей.").font(.footnote).foregroundStyle(
                    AppPalette.muted)
            }.padding(24)
        }
        .scrollDismissesKeyboard(.interactively).accessibilityIdentifier("create-form")
    }
}
