import SwiftUI

struct DatePollSettingsFields: View {
    @Binding var settings: DatePollSettings

    var body: some View {
        VStack(spacing: DesignTokens.spaceS0) {
            row("Несколько ответов", value: $settings.multipleAnswers)
            row("Можно изменить голос", value: $settings.allowRevoting)
            row("Можно добавлять варианты", value: $settings.allowNewOptions)
            row("Анонимный опрос", value: $settings.anonymous)
            row("Скрыть итоги до завершения", value: $settings.hideResults)
        }.toggleStyle(.switch).tint(DesignTokens.colorAccent)
            .designFont(DesignTokens.typographySizeButton)

    }
    private func row(_ label: String, value: Binding<Bool>) -> some View {
        Toggle(label, isOn: value).frame(minHeight: DesignTokens.componentMobileFormSwitchRowHeight)
    }
}
