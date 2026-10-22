import Foundation

enum CalendarRefresh {
    static func delay(page: CalendarPage?, failures: Int, now: Date) -> TimeInterval {
        let interval = Double(max(1, page?.refreshAfterSeconds ?? 5))
        if failures > 0 { return min(60, interval * pow(2, Double(min(failures, 4)))) }
        guard let deadline = page?.nextTransitionAt?.date else { return interval }
        let remaining = deadline.timeIntervalSince(now)
        return remaining > 0 ? min(interval, max(0.25, remaining)) : interval
    }
}
