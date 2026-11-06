import SwiftUI

struct TaskExample: View {
    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS20) {
            ForEach([false, true], id: \.self) { accepted in
                VStack(
                    alignment: .leading,
                    spacing: DesignTokens.componentMobileOnboardingStoryLabelGap
                ) {
                    Text(accepted ? "ДРУГ ПРИНЯЛ ЗАДАЧУ" : "ПРЕДЛОЖИЛИ ДРУГУ")
                        .font(.system(size: DesignTokens.componentMobileOnboardingStoryLabelSize))
                        .tracking(DesignTokens.componentMobileOnboardingStoryLabelTracking)
                        .foregroundStyle(DesignTokens.colorMuted)
                    VStack(alignment: .leading, spacing: DesignTokens.spaceS12) {
                        Text("Лена · 18:45").font(.system(size: DesignTokens.typographySizeLabel))
                            .foregroundStyle(DesignTokens.colorMuted)
                        Label("Подготовка", systemImage: "checklist").font(
                            .system(size: DesignTokens.typographySizeCaption)
                        ).foregroundStyle(DesignTokens.colorMuted)
                        Text("Заказать пиццу").font(
                            .system(
                                size: DesignTokens.componentMobilePreparationCardTitleSize,
                                weight: .semibold))
                        Label(
                            accepted ? "Исполняет Миша" : "Предложено Мише",
                            systemImage: "person.crop.circle"
                        )
                        .font(.system(size: DesignTokens.typographySizeSmall)).foregroundStyle(
                            DesignTokens.colorAccent)
                        if !accepted { ChatInlineAction(title: "Взять на себя") {} }
                    }.padding(DesignTokens.spaceS16).frame(maxWidth: .infinity, alignment: .leading)
                        .background(
                            DesignTokens.colorMessage,
                            in: RoundedRectangle(
                                cornerRadius: DesignTokens.componentMobileDecisionCardRadius))
                }
            }
        }
    }
}
