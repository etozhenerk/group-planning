import SwiftUI
import UIKit

/// Tap waits for horizontal pan to fail; a vertical gesture remains with the enclosing scroll view.
struct PhotoStackTouch: UIViewRepresentable {
    let changed: (CGFloat) -> Void
    let ended: (CGFloat) -> Void
    let open: () -> Void

    func makeUIView(context: Context) -> UIView {
        let view = UIView()
        view.backgroundColor = .clear
        view.isAccessibilityElement = false
        let pan = UIPanGestureRecognizer(
            target: context.coordinator, action: #selector(Coordinator.pan(_:)))
        pan.delegate = context.coordinator
        let tap = UITapGestureRecognizer(
            target: context.coordinator, action: #selector(Coordinator.tap))
        tap.require(toFail: pan)
        view.addGestureRecognizer(pan)
        view.addGestureRecognizer(tap)
        return view
    }

    func updateUIView(_ view: UIView, context: Context) { context.coordinator.value = self }
    func makeCoordinator() -> Coordinator { Coordinator(self) }

    final class Coordinator: NSObject, UIGestureRecognizerDelegate {
        var value: PhotoStackTouch
        init(_ value: PhotoStackTouch) { self.value = value }

        func gestureRecognizerShouldBegin(_ recognizer: UIGestureRecognizer) -> Bool {
            guard let pan = recognizer as? UIPanGestureRecognizer else { return true }
            let velocity = pan.velocity(in: pan.view?.window)
            return abs(velocity.x) > abs(velocity.y)
        }

        @objc func pan(_ recognizer: UIPanGestureRecognizer) {
            let distance = recognizer.translation(in: recognizer.view?.window).x
            switch recognizer.state {
            case .began, .changed: value.changed(distance)
            case .ended: value.ended(distance)
            case .cancelled, .failed: value.ended(0)
            default: break
            }
        }

        @objc func tap() { value.open() }
    }
}
