import SwiftUI

struct ActionFormButton: View {
    let title: String
    let busy: Bool
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            Text(title).designFont(14, weight: .semibold)
                .fixedSize(horizontal: false, vertical: true).opacity(busy ? 0 : 1)
                .frame(maxWidth: .infinity, minHeight: 22).padding(.vertical, 12)
                .padding(.horizontal, 18).foregroundStyle(AppPalette.actionText)
                .background(AppPalette.action, in: RoundedRectangle(cornerRadius: 13))
                .overlay { if busy { ProgressView().tint(AppPalette.actionText) } }
        }.buttonStyle(.plain).disabled(busy)
            .accessibilityLabel(title).accessibilityValue(busy ? "Выполняется" : "")
    }
}
