import SwiftUI

struct DecisionTextButton: View {
    let title: String
    var systemImage: String?
    var enabled = true
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            HStack(spacing: DesignTokens.spaceS8) {
                if let systemImage { Image(systemName: systemImage) }
                Text(title)
            }.designFont(DesignTokens.typographySizeBody)
                .frame(maxWidth: .infinity, minHeight: DesignTokens.targetIos, alignment: .leading)
                .contentShape(Rectangle())
        }.buttonStyle(.plain).foregroundStyle(DesignTokens.colorAccent).disabled(!enabled)
    }
}
