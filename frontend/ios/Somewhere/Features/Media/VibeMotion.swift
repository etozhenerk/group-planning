import SwiftUI

enum VibeMotion {
    static func animation(_ duration: Double) -> Animation {
        let curve = DesignTokens.motionEasingVibeGesture
        return .timingCurve(curve[0], curve[1], curve[2], curve[3], duration: duration)
    }
    static func accepts(
        _ distance: CGFloat, velocity: CGFloat, width: CGFloat, viewer: Bool = false
    ) -> Bool {
        let minimum = DesignTokens.componentMobileVibeDistanceMinimum
        let ratio = CGFloat(
            viewer
                ? DesignTokens.componentMobileVibeViewerDistanceRatio
                : DesignTokens.componentMobileVibeDistanceRatio)
        let threshold =
            viewer
            ? max(minimum, width * ratio)
            : min(DesignTokens.componentMobileVibeDistanceMaximum, max(minimum, width * ratio))
        return abs(distance) >= threshold
            || (abs(distance)
                > (viewer
                    ? DesignTokens.componentMobileVibeViewerFlickDistance
                    : DesignTokens.componentMobileVibeFlickDistance)
                && abs(velocity) > CGFloat(DesignTokens.componentMobileVibeFlickVelocityPerSecond))
    }
}
