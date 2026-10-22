import Foundation

struct MeetingCalendarSelection {
    enum Display { case list, calendar }
    var display: Display = .list
    var period: MeetingPeriod = .upcoming
    var undated = false
    var selected: [MeetingPeriod: String] = [:]
    var day: String { selected[period] ?? CalendarDate.today() }
    var creationDay: MeetingDraft.Day? {
        guard display == .calendar, !undated, let date = CalendarDate.parse(day) else { return nil }
        return LocalMeetingTime.day(date, zone: .gmt)
    }
    var filter: CalendarFilter {
        if undated { return CalendarFilter(period: .undated) }
        if display == .list { return CalendarFilter(period: period) }
        return CalendarFilter(
            period: period, from: day, to: CalendarDate.adding(day, component: .day, value: 1))
    }
    var monthFilter: CalendarFilter {
        let days = CalendarDate.days(day)
        return CalendarFilter(
            period: period, from: days.first,
            to: days.last.map { CalendarDate.adding($0, component: .day, value: 1) })
    }
}
