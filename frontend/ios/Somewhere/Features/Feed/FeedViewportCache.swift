import Foundation

/// Scroll coordinates are sampled for anchors, without publishing each pixel to SwiftUI.
@MainActor
final class FeedViewportCache {
    var frames: [UUID: CGRect] = [:]
    var visibleIDs: Set<UUID>?
}
