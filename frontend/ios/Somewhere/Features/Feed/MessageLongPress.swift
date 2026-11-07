import SwiftUI
import UIKit

struct MessageLongPress: ViewModifier {
    @Binding var pressed: Bool
    var enabled = true
    let perform: () -> Void
    @State private var controlFrames: [CGRect] = []

    @ViewBuilder func body(content: Content) -> some View {
        if #available(iOS 18, *) {
            content.gesture(
                MessagePressRecognizer(
                    pressed: $pressed, enabled: enabled, controlFrames: controlFrames,
                    perform: perform)
            )
            .overlayPreferenceValue(MessageControlBoundsPreference.self) { anchors in
                GeometryReader { _ in
                    Color.clear.onGeometryChange(for: [CGRect].self) { proxy in
                        let origin = proxy.frame(in: .global).origin
                        return anchors.map {
                            proxy[$0].offsetBy(dx: origin.x, dy: origin.y)
                        }
                    } action: { frames in
                        controlFrames = frames
                    }
                }.allowsHitTesting(false)
            }
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
    let controlFrames: [CGRect]
    let perform: () -> Void

    func makeUIGestureRecognizer(context: Context) -> UILongPressGestureRecognizer {
        let recognizer = UILongPressGestureRecognizer()
        recognizer.minimumPressDuration = DesignTokens.motionDurationReactionLongPress
        recognizer.allowableMovement =
            DesignTokens.componentReactionPickerLongPressMovementTolerance
        recognizer.delegate = context.coordinator
        context.coordinator.controlFrames = controlFrames
        recognizer.isEnabled = enabled
        return recognizer
    }

    func updateUIGestureRecognizer(_ recognizer: UILongPressGestureRecognizer, context: Context) {
        recognizer.isEnabled = enabled
        context.coordinator.controlFrames = controlFrames
    }

    func handleUIGestureRecognizerAction(
        _ recognizer: UILongPressGestureRecognizer, context: Context
    ) {
        pressed = recognizer.state == .began || recognizer.state == .changed
        if recognizer.state == .began { perform() }
    }

    func makeCoordinator(converter: CoordinateSpaceConverter) -> Coordinator { Coordinator() }

    final class Coordinator: NSObject, UIGestureRecognizerDelegate {
        var controlFrames: [CGRect] = []

        func gestureRecognizer(
            _ gestureRecognizer: UIGestureRecognizer, shouldReceive touch: UITouch
        ) -> Bool {
            let point = touch.location(in: touch.window)
            return !controlFrames.contains { $0.contains(point) }
        }

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
