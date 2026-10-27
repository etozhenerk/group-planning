import SwiftUI

enum ChatMotion {
    static func animation(_ duration: Double, reduceMotion: Bool) -> Animation? {
        if reduceMotion { return nil }
        let curve = DesignTokens.motionEasingStandard
        return .timingCurve(curve[0], curve[1], curve[2], curve[3], duration: duration)
    }
}
