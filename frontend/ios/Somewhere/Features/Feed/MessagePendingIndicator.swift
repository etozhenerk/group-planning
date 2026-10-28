import SwiftUI

/// The metadata slot persists after ACK; only its visibility changes.
struct MessagePendingIndicator: View {
    let since: Date?
    @State private var visible = false

    var body: some View {
        Color.clear
            .frame(
                width: DesignTokens.componentMessageDeliveryIndicatorSize,
                height: DesignTokens.componentMessageDeliveryIndicatorSize
            )
            .overlay {
                if showsIndicator {
                    ProgressView().controlSize(.mini).tint(DesignTokens.colorMuted)
                        .accessibilityLabel("Отправляется")
                        .accessibilityIdentifier("message-pending-indicator")
                }
            }
            .task(id: since) {
                visible = false
                guard let since else { return }
                let remaining = MessageDeliveryTiming.remaining(since: since)
                do {
                    try await Task.sleep(for: .seconds(remaining))
                    try Task.checkCancellation()
                    visible = true
                } catch is CancellationError {
                    // ACK, navigation and a changed intent cancel the pending presentation.
                } catch {
                    visible = false
                }
            }
    }

    private var showsIndicator: Bool { since != nil && visible }
}
