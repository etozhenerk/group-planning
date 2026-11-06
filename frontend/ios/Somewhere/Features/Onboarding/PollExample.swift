import SwiftUI

struct PollExample: View {
    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS16) {
            Text("Лена · 18:45").font(.system(size: DesignTokens.typographySizeLabel))
                .foregroundStyle(DesignTokens.colorMuted)
            Label("Опрос о месте", systemImage: "mappin").font(
                .system(size: DesignTokens.typographySizeCaption)
            ).foregroundStyle(DesignTokens.colorMuted)
            Text("У Саши дома").font(
                .system(size: DesignTokens.componentMobileDecisionCardTitleSize, weight: .bold))
            Text("У него большой стол для настолок.").font(
                .system(size: DesignTokens.typographySizeCaption)
            ).foregroundStyle(DesignTokens.colorMuted)
            HStack {
                ForEach(["За · 4", "Против · 1"], id: \.self) { text in
                    Text(text).font(.system(size: DesignTokens.typographySizeSmall)).frame(
                        maxWidth: .infinity
                    )
                    .padding(DesignTokens.spaceS12)
                    .background(
                        DesignTokens.colorBackground,
                        in: RoundedRectangle(cornerRadius: DesignTokens.radiusControl))
                }
            }
            Text("Место изменено").font(.system(size: DesignTokens.typographySizeLabel))
                .foregroundStyle(DesignTokens.colorMuted)
        }.padding(DesignTokens.spaceS16)
            .background(
                DesignTokens.colorMessage,
                in: RoundedRectangle(cornerRadius: DesignTokens.componentMobileDecisionCardRadius))
    }
}
