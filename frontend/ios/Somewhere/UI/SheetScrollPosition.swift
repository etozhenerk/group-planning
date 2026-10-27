import SwiftUI
import UIKit

/// Keeps the information sheet's scroll offset while its child occupies the same presentation.
struct SheetScrollPosition: UIViewRepresentable {
    @Binding var offset: CGFloat

    func makeUIView(context: Context) -> PositionView {
        let view = PositionView()
        view.savedOffset = $offset
        return view
    }

    func updateUIView(_ view: PositionView, context: Context) { view.savedOffset = $offset }

    @MainActor final class PositionView: UIView {
        var savedOffset: Binding<CGFloat>?
        private weak var scroll: UIScrollView?
        private var positionObservation: NSKeyValueObservation?
        private var sizeObservation: NSKeyValueObservation?
        private var restoring = true

        override func didMoveToWindow() {
            super.didMoveToWindow()
            guard window != nil else { return }
            DispatchQueue.main.async { [weak self] in self?.attach() }
        }

        private func attach() {
            guard scroll == nil else { return }
            var ancestor = superview
            while let view = ancestor, !(view is UIScrollView) { ancestor = view.superview }
            guard let scroll = ancestor as? UIScrollView else { return }
            self.scroll = scroll
            positionObservation = scroll.observe(\.contentOffset) { [weak self] _, _ in
                MainActor.assumeIsolated { self?.recordPosition() }
            }
            sizeObservation = scroll.observe(\.contentSize) { [weak self] _, _ in
                MainActor.assumeIsolated { self?.restorePosition() }
            }
            restorePosition()
        }

        private func restorePosition() {
            guard restoring, let scroll, scroll.contentSize.height > 0 else { return }
            let maximum = max(0, scroll.contentSize.height - scroll.bounds.height)
            scroll.setContentOffset(
                CGPoint(x: 0, y: min(savedOffset?.wrappedValue ?? 0, maximum)), animated: false)
            restoring = false
        }

        private func recordPosition() {
            guard !restoring, let scroll else { return }
            savedOffset?.wrappedValue = max(0, scroll.contentOffset.y)
        }
    }
}
