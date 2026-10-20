import SwiftUI

struct PreviewBadge: View {
    let title: String
    let symbol: String
    var body: some View {
        Label(title, systemImage: symbol).font(.system(size: 12, weight: .semibold))
            .padding(.horizontal, 12).padding(.vertical, 8)
            .foregroundStyle(AppPalette.accent)
            .background(AppPalette.accent.opacity(0.10), in: Capsule())
    }
}
