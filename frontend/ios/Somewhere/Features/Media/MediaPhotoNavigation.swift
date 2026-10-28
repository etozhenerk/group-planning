import Foundation

/// Albums have a first and last photo; neither swipe direction wraps around the boundary.
enum MediaPhotoNavigation {
    static func index(from current: Int, delta: Int, count: Int) -> Int {
        guard count > 0 else { return 0 }
        return min(max(current + delta, 0), count - 1)
    }
}
