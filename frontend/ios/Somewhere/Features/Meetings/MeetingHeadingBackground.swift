import SwiftUI

struct MeetingHeadingBackground: View {
    let scrolled: Bool

    var body: some View {
        UnevenRoundedRectangle(
            bottomLeadingRadius: scrolled ? 18 : 0,
            bottomTrailingRadius: scrolled ? 18 : 0
        )
        .fill(AppPalette.background)
        .overlay(alignment: .bottom) {
            LinearGradient(
                colors: [.black.opacity(scrolled ? 0.35 : 0), .clear],
                startPoint: .top, endPoint: .bottom
            )
            .frame(height: 20)
            .mask {
                LinearGradient(
                    stops: [
                        .init(color: .clear, location: 0),
                        .init(color: .black, location: 0.05),
                        .init(color: .black, location: 0.95),
                        .init(color: .clear, location: 1),
                    ], startPoint: .leading, endPoint: .trailing)
            }
            .offset(y: 20)
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}
