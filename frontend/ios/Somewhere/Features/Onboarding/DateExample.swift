import SwiftUI

struct DateExample: View {
    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS12) {
            Label("Опрос", systemImage: "calendar").font(
                .system(size: DesignTokens.typographySizeLabel)
            ).foregroundStyle(DesignTokens.colorMuted)
            Text("Когда встретимся?").font(
                .system(size: DesignTokens.componentMobileDecisionCardTitleSize, weight: .bold))
            Text("Выберите один вариант.").font(.system(size: DesignTokens.typographySizeCaption))
                .foregroundStyle(DesignTokens.colorMuted)
            ForEach(["7 ноября", "8 ноября"], id: \.self) { date in
                HStack {
                    VStack(alignment: .leading, spacing: DesignTokens.spaceS4) {
                        Text(date).font(
                            .system(size: DesignTokens.typographySizeButton, weight: .semibold))
                        Text(date == "7 ноября" ? "Суббота" : "Воскресенье").font(
                            .system(size: DesignTokens.typographySizeLabel)
                        ).foregroundStyle(DesignTokens.colorMuted)
                    }
                    Spacer()
                    Text(date == "7 ноября" ? "2 голоса" : "4 голоса").font(
                        .system(size: DesignTokens.typographySizeSmall))
                }.padding(DesignTokens.spaceS10)
                    .frame(minHeight: DesignTokens.componentMobileDecisionOptionMinimumHeight)
                    .background(
                        date == "8 ноября" ? DesignTokens.colorMobileDecisionSelected : .clear,
                        in: RoundedRectangle(cornerRadius: DesignTokens.radiusControl)
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: DesignTokens.radiusControl).stroke(
                            DesignTokens.colorLine, lineWidth: DesignTokens.spaceS1))
            }
            Text("Опрос завершён · дата выбрана").font(
                .system(size: DesignTokens.typographySizeLabel)
            ).foregroundStyle(DesignTokens.colorMuted)
        }.padding(DesignTokens.spaceS16)
            .background(
                DesignTokens.colorMessage,
                in: RoundedRectangle(cornerRadius: DesignTokens.componentMobileDecisionCardRadius))
    }
}
