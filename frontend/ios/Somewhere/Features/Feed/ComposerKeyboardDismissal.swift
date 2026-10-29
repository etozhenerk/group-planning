import UIKit

/// Observe completed outside taps without cancelling the tapped control's action.
@MainActor
final class ComposerKeyboardDismissal: NSObject, UIGestureRecognizerDelegate {
    private weak var input: UITextView?
    private lazy var tap = UITapGestureRecognizer(target: self, action: #selector(dismissKeyboard))

    init(input: UITextView) {
        self.input = input
        super.init()
        tap.cancelsTouchesInView = false
        tap.delaysTouchesBegan = false
        tap.delaysTouchesEnded = false
        tap.delegate = self
    }

    func attach(to window: UIWindow?) {
        guard tap.view !== window else { return }
        tap.view?.removeGestureRecognizer(tap)
        window?.addGestureRecognizer(tap)
    }

    func gestureRecognizer(
        _ gestureRecognizer: UIGestureRecognizer, shouldReceive touch: UITouch
    ) -> Bool {
        guard let input, input.isFirstResponder else { return false }
        return touch.view?.isDescendant(of: input) != true
            && !input.bounds.contains(touch.location(in: input))
    }

    func gestureRecognizer(
        _ gestureRecognizer: UIGestureRecognizer,
        shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer
    ) -> Bool {
        true
    }

    @objc private func dismissKeyboard() {
        // A tapped field may already own focus by the time this tap is recognized.
        guard let input, input.isFirstResponder else { return }
        input.resignFirstResponder()
    }
}
