import SwiftUI

struct ActionDateField: View {
    let title: String
    @Binding var selection: Date
    var includeTime = false
    var zone: TimeZone = .gmt
    var hideLabel = false
    var timeOnly = false
    var omitWeekday = false
    @State private var presented = false
    @State private var draft = Date()

    private var label: String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "ru_RU")
        formatter.timeZone = zone
        formatter.dateFormat =
            timeOnly
            ? "HH:mm" : includeTime ? "d MMMM yyyy, HH:mm" : omitWeekday ? "d MMMM" : "EE, d MMMM"
        return formatter.string(from: selection)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.componentMobileFieldGap) {
            if !hideLabel {
                Text(title).designFont(DesignTokens.typographySizeCaption).foregroundStyle(
                    DesignTokens.colorMuted)
            }
            Button {
                SystemKeyboard.dismiss()
                draft = selection
                presented = true
            } label: {
                HStack(spacing: DesignTokens.spaceS8) {
                    Image(systemName: timeOnly ? "clock" : "calendar")
                        .font(.system(size: DesignTokens.componentMobileFieldIconSize))
                        .foregroundStyle(DesignTokens.colorMuted)
                    Text(label).fixedSize(horizontal: false, vertical: true)
                    Spacer(minLength: DesignTokens.spaceS0)
                    Image(systemName: "chevron.down").font(.caption).foregroundStyle(
                        DesignTokens.colorMuted)
                }.actionField().contentShape(Rectangle())
            }.buttonStyle(.plain).accessibilityLabel(title).accessibilityValue(label)
        }.sheet(isPresented: $presented) {
            ActionFormSheet(title: title, headerIdentifier: "picker-header") {
                if !timeOnly {
                    DatePicker(title, selection: $draft, displayedComponents: .date)
                        .datePickerStyle(.graphical).labelsHidden()
                }
                if includeTime || timeOnly {
                    DatePicker("Время", selection: $draft, displayedComponents: .hourAndMinute)
                        .datePickerStyle(.wheel).labelsHidden()
                }
            } footer: {
                ActionFormButton(title: "Готово") {
                    selection = draft
                    presented = false
                }
                .accessibilityIdentifier("picker-done")
            }
            .environment(\.chatSheetClose, ChatSheetCloseAction(perform: { presented = false }))
            .environment(\.timeZone, zone).environment(\.locale, Locale(identifier: "ru_RU"))
        }
    }
}
