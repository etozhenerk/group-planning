import SwiftUI

struct DatePollDayPicker: View {
    let title: String
    @Binding var day: String
    var body: some View {
        DatePicker(
            title,
            selection: Binding(
                get: { CalendarDate.parse(day) ?? Date() },
                set: { day = CalendarDate.string($0) }), displayedComponents: .date
        )
        .environment(\.timeZone, .gmt)
        .environment(\.calendar, CalendarDate.calendar)
        .environment(\.locale, Locale(identifier: "ru_RU"))
    }
}
