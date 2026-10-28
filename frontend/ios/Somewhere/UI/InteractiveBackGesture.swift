import SwiftUI
import UIKit

struct InteractiveBackGesture: UIViewControllerRepresentable {
    let blocked: Bool

    func makeUIViewController(context: Context) -> Controller { Controller() }

    func updateUIViewController(_ controller: Controller, context: Context) {
        controller.blocked = blocked
        controller.install()
    }

    static func dismantleUIViewController(_ controller: Controller, coordinator: ()) {
        controller.restore()
    }

    final class Controller: UIViewController, UIGestureRecognizerDelegate {
        var blocked = false
        private weak var gesture: UIGestureRecognizer?
        private weak var previous: (any UIGestureRecognizerDelegate)?
        private var wasEnabled = false

        override func viewDidAppear(_ animated: Bool) {
            super.viewDidAppear(animated)
            install()
        }

        func install() {
            guard let navigation = navigationController,
                let recognizer = navigation.interactivePopGestureRecognizer
            else { return }
            if gesture !== recognizer {
                restore()
                gesture = recognizer
                previous = recognizer.delegate
                wasEnabled = recognizer.isEnabled
            }
            recognizer.delegate = self
            recognizer.isEnabled = !blocked && navigation.viewControllers.count > 1
        }

        func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
            !blocked && (navigationController?.viewControllers.count ?? 0) > 1
                && navigationController?.transitionCoordinator == nil
        }

        func restore() {
            if gesture?.delegate === self {
                gesture?.delegate = previous
                gesture?.isEnabled = wasEnabled
            }
            gesture = nil
        }
    }
}
