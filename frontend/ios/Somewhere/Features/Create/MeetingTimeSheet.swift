import SwiftUI

struct MeetingTimeSheet: View {
    let draft: MeetingDraft
    let select: (Date) -> Void
    @State private var selected: Date
    private var zone: TimeZone { TimeZone(identifier: draft.timezone) ?? .gmt }
    init(draft: MeetingDraft, select: @escaping (Date) -> Void) {
        self.draft = draft
        self.select = select
        let calendar = LocalMeetingTime.calendar(TimeZone(identifier: draft.timezone) ?? .gmt)
        let day = calendar.startOfDay(for: Date())
        let initial = calendar.date(
            bySettingHour: draft.clock?.hour ?? 19, minute: draft.clock?.minute ?? 0, second: 0,
            of: day)
        _selected = State(initialValue: initial ?? day)
    }
    var body: some View {
        MeetingPickerSheet(title: "Время встречи", height: 400, confirm: { select(selected) }) {
            DatePicker("Время встречи", selection: $selected, displayedComponents: .hourAndMinute)
                .datePickerStyle(.wheel).labelsHidden()
                .frame(maxWidth: .infinity).frame(height: 216)
                .accessibilityIdentifier("meeting-time-picker")
        }
        .environment(\.timeZone, zone).environment(\.calendar, LocalMeetingTime.calendar(zone))
        .environment(\.locale, Locale(identifier: "ru_RU")).tint(AppPalette.accent)
    }
}
