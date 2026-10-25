import SwiftUI

struct ActionFormPage<Content: View>: View {
    let title: String
    let dismissDisabled: Bool
    @ViewBuilder let content: () -> Content
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Button {
                        SystemKeyboard.dismiss()
                        dismiss()
                    } label: {
                        HStack(spacing: 8) {
                            ExperienceIcon(kind: .back, size: 18)
                            Text("Назад").designFont(13)
                        }.foregroundStyle(AppPalette.accent).frame(minHeight: 44)
                            .contentShape(Rectangle())
                    }.disabled(dismissDisabled).accessibilityLabel("Назад")
                        .accessibilityIdentifier("action-form-back")
                    Text(title).designFont(28, weight: .bold).tracking(-0.9)
                        .accessibilityAddTraits(.isHeader).padding(.bottom, 24)
                    VStack(alignment: .leading, spacing: 18, content: content)
                        .designFont(13).padding(20)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(AppPalette.surface, in: RoundedRectangle(cornerRadius: 22))
                }.padding(.horizontal, 20).padding(.top, 28).padding(.bottom, 28)
            }.scrollDismissesKeyboard(.interactively)
                .accessibilityIdentifier("action-form-scroll")
                .background(AppPalette.background).toolbar(.hidden, for: .navigationBar)
                .safeAreaInset(edge: .top, spacing: 0) { ServicePageHeader() }
                .toolbar {
                    ToolbarItemGroup(placement: .keyboard) {
                        Spacer()
                        Button("Готово") { SystemKeyboard.dismiss() }
                            .accessibilityIdentifier("action-keyboard-done")
                    }
                }
        }.interactiveDismissDisabled(dismissDisabled)
            .preferredColorScheme(.dark).foregroundStyle(AppPalette.text).tint(AppPalette.accent)
    }
}
