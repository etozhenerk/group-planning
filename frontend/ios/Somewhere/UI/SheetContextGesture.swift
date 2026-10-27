import SwiftUI
import UIKit

struct SheetContextGesture: UIViewControllerRepresentable {
    let blocked: Bool
    let closeParent: (() -> Void)?

    func makeUIViewController(context: Context) -> UIViewController { UIViewController() }

    func updateUIViewController(_ controller: UIViewController, context: Context) {
        context.coordinator.blocked = blocked
        context.coordinator.closeParent = closeParent
        DispatchQueue.main.async {
            var parent = controller.parent
            while let next = parent?.parent { parent = next }
            guard let presentation = parent?.presentationController else { return }
            if presentation.delegate !== context.coordinator {
                context.coordinator.original = presentation.delegate
                presentation.delegate = context.coordinator
            }
        }
    }

    func makeCoordinator() -> Coordinator { Coordinator() }

    @MainActor final class Coordinator: NSObject, UIAdaptivePresentationControllerDelegate {
        var blocked = false
        var closeParent: (() -> Void)?
        weak var original: (any UIAdaptivePresentationControllerDelegate)?

        func presentationControllerShouldDismiss(_ presentation: UIPresentationController) -> Bool {
            !blocked && closeParent == nil
                && (original?.presentationControllerShouldDismiss?(presentation) ?? true)
        }

        func presentationControllerDidAttemptToDismiss(_ presentation: UIPresentationController) {
            if !blocked, let closeParent {
                closeParent()
            } else {
                original?.presentationControllerDidAttemptToDismiss?(presentation)
            }
        }

        func presentationControllerWillDismiss(_ presentation: UIPresentationController) {
            original?.presentationControllerWillDismiss?(presentation)
        }

        func presentationControllerDidDismiss(_ presentation: UIPresentationController) {
            original?.presentationControllerDidDismiss?(presentation)
        }
    }
}
