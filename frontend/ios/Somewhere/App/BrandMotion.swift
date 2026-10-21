import Foundation

enum BrandMotion {
    static let duration: TimeInterval = 1.2

    static func rotation(elapsed: TimeInterval, moving: Bool) -> Double {
        guard moving else { return 0 }

        let turns = max(0, elapsed) / duration
        let wholeTurns = floor(turns)
        let progress = turns - wholeTurns
        // A full turn settles into the original mark, with no jump between cycles.
        let eased = progress * progress * progress * (progress * (progress * 6 - 15) + 10)
        return 360 * (wholeTurns + eased)
    }
}
