import SwiftUI
import UIKit

struct OnboardingProgress: UIViewRepresentable {
    @Environment(\.isEnabled) private var enabled
    let selected: OnboardingSlide
    let choose: (OnboardingSlide) -> Void
    func makeUIView(context: Context) -> UIPageControl {
        let control = UIPageControl()
        control.numberOfPages = OnboardingSlide.allCases.count
        control.currentPageIndicatorTintColor = UIColor(DesignTokens.colorAccent)
        control.pageIndicatorTintColor = UIColor(DesignTokens.colorMobileOnboardingInactive)
        control.addTarget(
            context.coordinator, action: #selector(Coordinator.changed), for: .valueChanged)
        control.accessibilityIdentifier = "onboarding-progress"
        control.accessibilityLabel = "Слайды знакомства"
        return control
    }
    func updateUIView(_ control: UIPageControl, context: Context) {
        context.coordinator.choose = choose
        control.isEnabled = enabled
        control.currentPage = selected.rawValue
        control.accessibilityValue =
            String(selected.rawValue + 1) + " из " + String(OnboardingSlide.allCases.count)
    }
    func makeCoordinator() -> Coordinator { Coordinator(choose: choose) }
    @MainActor final class Coordinator: NSObject {
        var choose: (OnboardingSlide) -> Void
        init(choose: @escaping (OnboardingSlide) -> Void) { self.choose = choose }
        @objc func changed(_ control: UIPageControl) {
            if let slide = OnboardingSlide(rawValue: control.currentPage) { choose(slide) }
        }
    }
}
