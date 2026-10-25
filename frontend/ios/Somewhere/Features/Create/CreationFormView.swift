import SwiftUI

struct CreationFormView: View {
    let owner: CreationOwner
    @State private var coverExpanded = false
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Button(action: owner.requestClose) {
                    HStack(spacing: 7) {
                        ExperienceIcon(kind: .back)
                        Text("Мои встречи")
                    }
                    .designFont(13).frame(minHeight: 44)
                }.accessibilityLabel("Закрыть").disabled(owner.busy || owner.preparingCover)
                Text("Новая встреча").designFont(28, weight: .bold).tracking(-0.9).padding(
                    .bottom, 24)
                VStack(alignment: .leading, spacing: 18) {
                    CreationFieldsView(owner: owner)
                    Button {
                        coverExpanded.toggle()
                    } label: {
                        HStack {
                            Text("Обложка")
                            Spacer()
                            Image(systemName: coverExpanded ? "chevron.up" : "chevron.down")
                                .font(.system(size: 12))
                        }.designFont(13).frame(minHeight: 44).contentShape(Rectangle())
                    }.buttonStyle(.plain).accessibilityIdentifier("create-cover-expand")
                        .accessibilityValue(coverExpanded ? "Развёрнуто" : "Свёрнуто")
                    if coverExpanded {
                        CoverEditor(
                            value: owner.value.cover, disabled: !owner.editable,
                            onBusy: { owner.preparingCover = $0 },
                            onChange: { cover in owner.change { $0.cover = cover } })
                    }
                    if let problem = owner.problem {
                        Text(problem).designFont(12).foregroundStyle(AppPalette.error)
                            .accessibilityIdentifier("create-problem")
                    }
                    if let warning = owner.draftWarning {
                        Text(warning).designFont(12).foregroundStyle(AppPalette.error)
                    }
                    HStack(spacing: 14) {
                        Button("Отмена", action: owner.requestClose).font(
                            .system(size: 14, weight: .semibold)
                        )
                        .padding(.horizontal, 18).frame(minHeight: 47)
                        .overlay {
                            RoundedRectangle(cornerRadius: 13).stroke(
                                .white.opacity(0.125), lineWidth: 1)
                        }
                        .disabled(owner.busy || owner.preparingCover)
                        Spacer(minLength: 0)
                        Button(action: owner.startSubmit) {
                            Group {
                                if owner.busy {
                                    ProgressView()
                                } else {
                                    Text(owner.frozen ? "Повторить сохранение" : "Создать встречу")
                                }
                            }
                            .designFont(14, weight: .semibold).padding(.horizontal, 18)
                            .frame(minHeight: 47)
                            .foregroundStyle(AppPalette.actionText).background(
                                AppPalette.action, in: RoundedRectangle(cornerRadius: 13))
                        }.disabled(owner.preparingCover || owner.busy).accessibilityIdentifier(
                            "create-submit")
                    }
                }.padding(20).background(AppPalette.surface, in: RoundedRectangle(cornerRadius: 22))
            }.padding(.horizontal, 20).padding(.top, 28).padding(.bottom, 28)
        }.scrollDismissesKeyboard(.interactively).accessibilityIdentifier("create-form")
    }
}
