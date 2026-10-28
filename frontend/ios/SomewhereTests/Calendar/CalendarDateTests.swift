import Foundation
import Testing

@testable import Somewhere

struct CalendarDateTests {
    @Test func civilArithmeticAcrossLeapYear() throws {
        #expect(CalendarDate.parse("2026-02-30") == nil)
        #expect(CalendarDate.adding("2027-12-31", component: .month, value: 1) == "2028-01-31")
        #expect(CalendarDate.adding("2028-01-31", component: .month, value: 1) == "2028-02-29")
        #expect(CalendarDate.days("2028-02-29").count == 35)
        #expect(CalendarDate.days("2028-02-29").first == "2028-01-31")
        let now = try APIInstant("2026-10-22T23:30:00Z")
        #expect(
            CalendarDate.today(now.date, zone: try #require(TimeZone(identifier: "Asia/Tokyo")))
                == "2026-10-23")
    }
    @Test(arguments: [
        ("2021-02-15", "2021-02-01", "2021-02-28", 28),
        ("2026-10-31", "2026-09-28", "2026-11-01", 35),
        ("2027-05-20", "2027-04-26", "2027-06-06", 42),
    ])
    func monthGridContainsOnlyCompleteWeeksCoveringMonth(
        selected: String, first: String, last: String, count: Int
    ) {
        let days = CalendarDate.days(selected)
        #expect(days.count == count)
        #expect(days.first == first)
        #expect(days.last == last)
        for (index, day) in days.enumerated() {
            #expect(day == CalendarDate.adding(first, component: .day, value: index))
        }
    }

    @Test @MainActor func selectionRetainsBothPeriodsAndCreationContext() {
        var selection = MeetingCalendarSelection()
        selection.selected[.upcoming] = "2026-10-24"
        #expect(selection.creationDay == nil)
        selection.display = .calendar
        #expect(selection.creationDay == MeetingDraft.Day(year: 2026, month: 10, day: 24))
        selection.selected[.past] = "2026-09-20"
        selection.period = .past
        #expect(selection.day == "2026-09-20")
        selection.period = .upcoming
        #expect(selection.day == "2026-10-24")
        selection.undated = true
        #expect(selection.creationDay == nil && selection.filter.period == .undated)
    }
    @Test @MainActor func refreshHonorsServerDeadlineWithoutBusyLoop() throws {
        let page = try APICoding.decode(
            CalendarPage.self, from: CalendarFixtures.page(transition: "2026-10-22T12:00:02Z"))
        let now = try APIInstant("2026-10-22T12:00:00Z").date
        #expect(CalendarRefresh.delay(page: page, failures: 0, now: now) == 2)
        #expect(CalendarRefresh.delay(page: page, failures: 0, now: now.addingTimeInterval(4)) == 5)
        #expect(CalendarRefresh.delay(page: page, failures: 3, now: now) == 40)
    }
}
