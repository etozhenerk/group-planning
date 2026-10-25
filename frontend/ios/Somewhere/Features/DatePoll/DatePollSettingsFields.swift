import SwiftUI

struct DatePollSettingsFields: View {
    @Binding var settings: DatePollSettings
    var body: some View {
        Toggle("Можно выбрать несколько дат", isOn: $settings.multipleAnswers).toggleStyle(
            ActionCheckboxStyle())
        Toggle("Можно изменить голос", isOn: $settings.allowRevoting).toggleStyle(
            ActionCheckboxStyle())
        Toggle("Можно добавить дату", isOn: $settings.allowNewOptions).toggleStyle(
            ActionCheckboxStyle())
        Toggle("Анонимное голосование", isOn: $settings.anonymous).toggleStyle(
            ActionCheckboxStyle())
        Toggle("Скрывать результаты до завершения", isOn: $settings.hideResults).toggleStyle(
            ActionCheckboxStyle())
    }
}
