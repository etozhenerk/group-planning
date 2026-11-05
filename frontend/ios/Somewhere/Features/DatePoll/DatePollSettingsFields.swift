import SwiftUI

struct DatePollSettingsFields: View {
    @Binding var settings: DatePollSettings
    var body: some View {
        VStack(spacing: DesignTokens.spaceS0) {
            Divider().overlay(DesignTokens.colorLine)
                .padding(.bottom, DesignTokens.componentMobileFormGroupGap)
            row("Несколько ответов", value: $settings.multipleAnswers)
            row("Можно изменить голос", value: $settings.allowRevoting)
            row("Можно добавлять варианты", value: $settings.allowNewOptions)
            row("Анонимный опрос", value: $settings.anonymous)
            row("Скрыть итоги до завершения", value: $settings.hideResults)
        }
    }
    private func row(_ label: String, value: Binding<Bool>) -> some View {
        Button {
            value.wrappedValue.toggle()
        } label: {
            HStack(spacing: DesignTokens.componentMobileFormSectionGap) {
                Text(label).frame(maxWidth: .infinity, alignment: .leading)
                Capsule().fill(
                    value.wrappedValue ? DesignTokens.colorAccent : DesignTokens.colorBorderStrong
                )
                .frame(
                    width: DesignTokens.componentMobileFormSwitchWidth,
                    height: DesignTokens.componentMobileFormSwitchHeight
                )
                .overlay(alignment: value.wrappedValue ? .trailing : .leading) {
                    Circle().fill(
                        value.wrappedValue ? DesignTokens.colorOwnText : DesignTokens.colorMuted
                    )
                    .frame(
                        width: DesignTokens.componentMobileFormSwitchThumbSize,
                        height: DesignTokens.componentMobileFormSwitchThumbSize
                    )
                    .padding(DesignTokens.componentMobileFormSwitchThumbInset)
                }
            }.designFont(DesignTokens.typographySizeSmall)
                .frame(minHeight: DesignTokens.componentMobileDecisionSwitchRowHeight).contentShape(
                    Rectangle())
        }.buttonStyle(.plain)
            .accessibilityRepresentation { Toggle(label, isOn: value).toggleStyle(.switch) }
    }
}
