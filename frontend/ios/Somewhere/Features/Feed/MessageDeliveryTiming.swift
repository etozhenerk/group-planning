import Foundation

enum MessageDeliveryTiming {
    static func remaining(since: Date, now: Date = .now) -> TimeInterval {
        let delay = Double(DesignTokens.componentMessageDeliveryPendingDelay)
        return min(delay, max(0, since.timeIntervalSince(now) + delay))
    }
}
