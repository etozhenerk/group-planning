import SwiftUI

struct OnboardingPager: UIViewControllerRepresentable {
    let destination: OnboardingSlide
    let settled: (OnboardingSlide) -> Void
    let moving: (Bool) -> Void
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func makeUIViewController(context: Context) -> OnboardingPagerController {
        OnboardingPagerController()
    }

    func updateUIViewController(_ controller: OnboardingPagerController, context: Context) {
        controller.settled = settled
        controller.moving = moving
        controller.reduceMotion = reduceMotion
        controller.request(destination)
    }
}
