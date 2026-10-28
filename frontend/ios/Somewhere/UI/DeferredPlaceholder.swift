import SwiftUI

/// Reserve layout immediately, but do not flash a skeleton for a fast response.
struct DeferredPlaceholder<Content: View>: View {
    @ViewBuilder let content: () -> Content
    @State private var visible = false

    var body: some View {
        content().opacity(visible ? 1 : 0).accessibilityHidden(!visible)
            .task {
                do { try await Task.sleep(for: .seconds(DesignTokens.motionDurationFast)) } catch {
                    return
                }
                visible = true
            }
    }
}
