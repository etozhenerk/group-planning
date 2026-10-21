import SwiftUI

struct BrandMark: View {
    var animated = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.scenePhase) private var scenePhase
    @State private var started = Date()
    @State private var finished = false

    private var moving: Bool { animated && !reduceMotion && scenePhase == .active }

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 60, paused: !moving || finished)) {
            context in
            let rotation = BrandMotion.rotation(
                elapsed: finished ? BrandMotion.duration : context.date.timeIntervalSince(started),
                moving: moving)
            Image("BrandMark").renderingMode(.template).resizable().scaledToFit()
                .rotationEffect(.degrees(rotation))
        }
        .accessibilityHidden(true)
        .task {
            guard animated else { return }
            do { try await Task.sleep(for: .seconds(BrandMotion.duration)) } catch { return }
            finished = true
        }
    }
}
