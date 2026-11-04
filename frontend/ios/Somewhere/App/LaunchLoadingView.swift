import SwiftUI

struct LaunchLoadingView: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.scenePhase) private var scenePhase
    @State private var started = Date()
    @State private var finished = false

    private var moving: Bool { !reduceMotion && scenePhase == .active }

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 60, paused: !moving || finished)) {
            context in
            LaunchArtwork(
                rotation: BrandMotion.rotation(
                    elapsed: finished
                        ? BrandMotion.duration : context.date.timeIntervalSince(started),
                    moving: moving)
            )
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(AppPalette.background.ignoresSafeArea())
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("somewhere, приложение загружается")
        .accessibilityIdentifier("app-loading")
        .task {
            do { try await Task.sleep(for: .seconds(BrandMotion.duration)) } catch { return }
            finished = true
        }
    }
}
