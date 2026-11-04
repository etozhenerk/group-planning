import SwiftUI
import UIKit

struct LaunchArtwork: UIViewRepresentable {
    var rotation: Double

    func makeUIView(context: Context) -> UIView {
        guard
            let view = UIStoryboard(name: "LaunchScreen", bundle: .main)
                .instantiateInitialViewController()?.view
        else {
            preconditionFailure("LaunchScreen must contain the launch composition")
        }
        return view
    }

    func updateUIView(_ view: UIView, context: Context) {
        view.viewWithTag(1)?.transform = CGAffineTransform(rotationAngle: rotation * .pi / 180)
    }
}
