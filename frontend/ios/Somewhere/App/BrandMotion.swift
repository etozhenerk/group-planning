import Foundation

enum BrandMotion {
    static let duration: TimeInterval = 1.2

    static func rotation(elapsed: TimeInterval, moving: Bool) -> Double {
        guard moving else { return 0 }

        let progress = min(max(0, elapsed / duration), 1)
        let eased = progress * progress * progress * (progress * (progress * 6 - 15) + 10)
        return 360 * eased
    }
}
