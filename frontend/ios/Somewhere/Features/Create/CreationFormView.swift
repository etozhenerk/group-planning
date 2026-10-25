import SwiftUI

struct CreationFormView: View {
    let owner: CreationOwner
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                CreationFieldsView(owner: owner)
                CoverEditor(
                    value: owner.value.cover, disabled: !owner.editable,
                    onBusy: { owner.preparingCover = $0 },
                    onChange: { cover in owner.change { $0.cover = cover } })
                if let problem = owner.problem {
                    Text(problem).foregroundStyle(AppPalette.error).accessibilityIdentifier(
                        "create-problem")
                }
                if let warning = owner.draftWarning {
                    Text(warning).foregroundStyle(AppPalette.error)
                }
                ActionButton(
                    title: owner.frozen ? "Повторить сохранение" : "Создать встречу",
                    disabled: owner.preparingCover, busy: owner.busy, action: owner.startSubmit
                )
                .accessibilityIdentifier("create-submit")
                Text("После создания появится ссылка для друзей.").font(.footnote).foregroundStyle(
                    AppPalette.muted)
            }.padding(24)
        }
        .scrollDismissesKeyboard(.interactively).accessibilityIdentifier("create-form")
    }
}
