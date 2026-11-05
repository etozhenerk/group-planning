import SwiftUI
import UIKit

// QA-only geometry for native layout checks on the existing simulator.
// Captures keep both the physical screen and the measured UIWindow bounds.
struct UITestViewport: ViewModifier {
    func body(content: Content) -> some View {
        content.background {
            ViewportProbe().frame(width: 0, height: 0).allowsHitTesting(false)
        }
    }
}

private struct ViewportProbe: UIViewRepresentable {
    func makeUIView(context: Context) -> ViewportView { ViewportView() }
    func updateUIView(_ view: ViewportView, context: Context) {}
}

private final class ViewportView: UIView {
    override func didMoveToWindow() {
        super.didMoveToWindow()
        guard Bundle.main.bundleIdentifier == "dev.groupplanning.ios.uitesthost",
            ProcessInfo.processInfo.environment["SOMEWHERE_UI_VIEWPORT"] == "320x568"
        else { return }
        DispatchQueue.main.async { [weak self] in
            guard let window = self?.window, let screen = window.windowScene?.screen else { return }
            window.frame = CGRect(x: screen.bounds.midX - 160, y: 0, width: 320, height: 568)
            window.rootViewController?.view.frame = window.bounds
            window.layoutIfNeeded()
        }
    }
}
