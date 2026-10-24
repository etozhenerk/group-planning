import SwiftUI

struct ActionButton: View {
    let title: String
    var symbol: String? = nil
    var primary = true
    var disabled = false
    var busy = false
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if let symbol { Image(systemName: symbol).accessibilityHidden(true) }
                Text(title).fontWeight(.semibold).multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .opacity(busy ? 0 : 1)
            .frame(maxWidth: .infinity, minHeight: 24)
            .padding(.horizontal, 16).padding(.vertical, 12)
            .foregroundStyle(primary ? AppPalette.actionText : AppPalette.text)
            .background(
                primary ? AppPalette.action : AppPalette.surface,
                in: RoundedRectangle(cornerRadius: 14)
            )
            .overlay {
                if busy {
                    ProgressView().tint(primary ? AppPalette.actionText : AppPalette.text)
                        .accessibilityHidden(true)
                }
            }
        }
        .accessibilityLabel(title).accessibilityValue(busy ? "Выполняется" : "")
        .buttonStyle(.plain).disabled(disabled || busy).opacity(disabled && !busy ? 0.6 : 1)
    }
}
