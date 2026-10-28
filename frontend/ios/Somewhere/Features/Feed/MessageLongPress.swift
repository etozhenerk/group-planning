import SwiftUI
import UIKit

struct MessageLongPress: ViewModifier {
    @Binding var pressed: Bool
    var enabled = true
    let perform: () -> Void

    @ViewBuilder func body(content: Content) -> some View {
        if #available(iOS 18, *) {
            content.gesture(
                MessagePressRecognizer(pressed: $pressed, enabled: enabled, perform: perform))
        } else {
            content.onLongPressGesture(
                minimumDuration: DesignTokens.motionDurationReactionLongPress,
                maximumDistance: DesignTokens.componentReactionPickerLongPressMovementTolerance,
                perform: { if enabled { perform() } },
                onPressingChanged: { pressed = enabled && $0 })
        }
    }
}

@available(iOS 18, *)
private struct MessagePressRecognizer: UIGestureRecognizerRepresentable {
    @Binding var pressed: Bool
    var enabled = true
    let perform: () -> Void

    func makeUIGestureRecognizer(context: Context) -> UILongPressGestureRecognizer {
        let recognizer = UILongPressGestureRecognizer()
        recognizer.minimumPressDuration = DesignTokens.motionDurationReactionLongPress
        recognizer.allowableMovement =
            DesignTokens.componentReactionPickerLongPressMovementTolerance
        recognizer.delegate = context.coordinator
        recognizer.isEnabled = enabled
        return recognizer
    }

    func updateUIGestureRecognizer(_ recognizer: UILongPressGestureRecognizer, context: Context) {
        recognizer.isEnabled = enabled
    }

    func handleUIGestureRecognizerAction(
        _ recognizer: UILongPressGestureRecognizer, context: Context
    ) {
        pressed = recognizer.state == .began || recognizer.state == .changed
        if recognizer.state == .began { perform() }
    }

    func makeCoordinator(converter: CoordinateSpaceConverter) -> Coordinator { Coordinator() }

    final class Coordinator: NSObject, UIGestureRecognizerDelegate {
        func gestureRecognizer(
            _ gestureRecognizer: UIGestureRecognizer,
            shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer
        ) -> Bool {
            otherGestureRecognizer is UIPanGestureRecognizer
        }

        func gestureRecognizer(
            _ gestureRecognizer: UIGestureRecognizer,
            shouldBeRequiredToFailBy otherGestureRecognizer: UIGestureRecognizer
        ) -> Bool {
            !(otherGestureRecognizer is UIPanGestureRecognizer)
        }
    }
}
