import SwiftUI

struct DatePollSettingsFields: View {
    @Binding var settings: DatePollSettings
    var body: some View {
        Toggle("Можно выбрать несколько дат", isOn: $settings.multipleAnswers)
        Toggle("Можно изменить голос", isOn: $settings.allowRevoting)
        Toggle("Участники могут добавить даты", isOn: $settings.allowNewOptions)
        Toggle("Анонимное голосование", isOn: $settings.anonymous)
        Toggle("Скрыть результаты до окончания", isOn: $settings.hideResults)
    }
}
