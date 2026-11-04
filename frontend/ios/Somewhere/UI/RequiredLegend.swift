import SwiftUI

struct RequiredLegend: View {
    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: DesignTokens.spaceS4) {
            RequiredMark()
            Text("Обязательные поля")
                .designFont(DesignTokens.typographySizeCaption)
                .foregroundStyle(DesignTokens.colorMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}
