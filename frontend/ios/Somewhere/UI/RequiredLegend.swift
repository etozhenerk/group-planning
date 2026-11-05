import SwiftUI

struct RequiredLegend: View {
    var sentence = false
    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: DesignTokens.spaceS4) {
            RequiredMark()
            Text(sentence ? "— обязательные поля" : "Обязательные поля")
                .designFont(DesignTokens.typographySizeCaption)
                .foregroundStyle(DesignTokens.colorMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}
