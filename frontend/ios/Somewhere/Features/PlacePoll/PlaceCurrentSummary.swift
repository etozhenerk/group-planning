import SwiftUI

struct PlaceCurrentSummary: View {
    let place: String?
    var body: some View {
        HStack(alignment: .top, spacing: DesignTokens.spaceS12) {
            ChatIcon(kind: .pin, size: DesignTokens.componentMobileFieldIconSize)
                .foregroundStyle(DesignTokens.colorAccent)
            VStack(alignment: .leading, spacing: DesignTokens.spaceS4) {
                Text("Сейчас встречаемся здесь").designFont(DesignTokens.typographySizeLabel)
                    .foregroundStyle(DesignTokens.colorMuted)
                Text(place ?? "Место пока не выбрано").designFont(DesignTokens.typographySizeSmall)
            }.frame(maxWidth: .infinity, alignment: .leading)
        }.padding(DesignTokens.spaceS12 + DesignTokens.spaceS2)
            .background(
                DesignTokens.colorBackground,
                in: RoundedRectangle(cornerRadius: DesignTokens.spaceS12 + DesignTokens.spaceS2)
            )
            .overlay {
                RoundedRectangle(cornerRadius: DesignTokens.spaceS12 + DesignTokens.spaceS2)
                    .strokeBorder(DesignTokens.colorLine, lineWidth: DesignTokens.spaceS1)
            }
    }
}
