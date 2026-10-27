import SwiftUI

struct FeedScrollActivity: ViewModifier {
    @Binding var isScrolling: Bool
    @ViewBuilder func body(content: Content) -> some View {
        if #available(iOS 18, *) {
            content.onScrollPhaseChange { _, phase in
                isScrolling = phase == .interacting || phase == .decelerating
            }
        } else {
            content.simultaneousGesture(
                DragGesture().onChanged { _ in isScrolling = true }
                    .onEnded { _ in isScrolling = false })
        }
    }
}
