import SwiftUI

struct ActionDateField: View {
    let title: String
    @Binding var selection: Date
    var includeTime = false
    var zone: TimeZone = .gmt
    @State private var presented = false
    @State private var draft = Date()

    private var label: String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "ru_RU")
        formatter.timeZone = zone
        formatter.dateFormat = includeTime ? "d MMMM yyyy, HH:mm" : "d MMMM yyyy"
        return formatter.string(from: selection)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).designFont(13).frame(minHeight: 19.5)
            Button {
                SystemKeyboard.dismiss()
                draft = selection
                presented = true
            } label: {
                HStack(spacing: 8) {
                    Text(label).fixedSize(horizontal: false, vertical: true)
                    Spacer(minLength: 0)
                    ExperienceIcon(kind: .calendar, size: 16)
                }.actionField().contentShape(Rectangle())
            }.buttonStyle(.plain).accessibilityLabel(title).accessibilityValue(label)
        }.sheet(isPresented: $presented) {
            MeetingPickerSheet(
                title: title, height: includeTime ? 650 : 560,
                confirm: {
                    selection = draft
                }
            ) {
                DatePicker(title, selection: $draft, displayedComponents: .date)
                    .datePickerStyle(.graphical).labelsHidden()
                if includeTime {
                    DatePicker("Время", selection: $draft, displayedComponents: .hourAndMinute)
                        .datePickerStyle(.wheel).labelsHidden()
                }
            }.environment(\.timeZone, zone).environment(\.locale, Locale(identifier: "ru_RU"))
        }
    }
}
