import SwiftUI

struct ActionButton: View {
    let title: String
    var symbol: String? = nil
    var primary = true
    var disabled = false
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if let symbol { Image(systemName: symbol).accessibilityHidden(true) }
                Text(title).fontWeight(.semibold).lineLimit(1).minimumScaleFactor(0.6)
            }
            .frame(maxWidth: .infinity, minHeight: 24)
            .padding(.horizontal, 16).padding(.vertical, 12)
            .foregroundStyle(primary ? AppPalette.actionText : AppPalette.text)
            .background(
                primary ? AppPalette.action : AppPalette.surface,
                in: RoundedRectangle(cornerRadius: 14))
        }
        .buttonStyle(.plain).disabled(disabled).opacity(disabled ? 0.6 : 1)
    }
}
