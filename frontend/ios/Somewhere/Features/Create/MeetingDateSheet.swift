import SwiftUI

struct MeetingDateSheet: View {
    let draft: MeetingDraft
    let select: (Date) -> Void
    @State private var selected: Date
    private var zone: TimeZone { TimeZone(identifier: draft.timezone) ?? .gmt }
    init(draft: MeetingDraft, select: @escaping (Date) -> Void) {
        self.draft = draft
        self.select = select
        let calendar = LocalMeetingTime.calendar(TimeZone(identifier: draft.timezone) ?? .gmt)
        let initial = draft.day.flatMap {
            calendar.date(from: DateComponents(year: $0.year, month: $0.month, day: $0.day))
        }
        _selected = State(initialValue: initial ?? Date())
    }
    var body: some View {
        MeetingPickerSheet(title: "Дата встречи", height: 560, confirm: { select(selected) }) {
            DatePicker("Дата встречи", selection: $selected, displayedComponents: .date)
                .datePickerStyle(.graphical).labelsHidden()
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityIdentifier("meeting-date-picker")
        }
        .environment(\.timeZone, zone).environment(\.calendar, LocalMeetingTime.calendar(zone))
        .environment(\.locale, Locale(identifier: "ru_RU")).tint(AppPalette.accent)
    }
}
