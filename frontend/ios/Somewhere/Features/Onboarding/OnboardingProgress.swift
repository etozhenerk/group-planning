import SwiftUI
import UIKit

struct OnboardingProgress: UIViewRepresentable {
    let selected: OnboardingSlide
    let choose: (OnboardingSlide) -> Void
    func makeUIView(context: Context) -> UIPageControl {
        let control = UIPageControl()
        control.numberOfPages = OnboardingSlide.allCases.count
        control.currentPageIndicatorTintColor = UIColor(AppPalette.accent)
        control.pageIndicatorTintColor = UIColor(AppPalette.border)
        control.addTarget(
            context.coordinator, action: #selector(Coordinator.changed), for: .valueChanged)
        control.accessibilityIdentifier = "onboarding-progress"
        control.accessibilityLabel = "Слайды знакомства"
        return control
    }
    func updateUIView(_ control: UIPageControl, context: Context) {
        context.coordinator.choose = choose
        control.currentPage = selected.rawValue
        control.accessibilityValue = String(selected.rawValue + 1) + " из 5"
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
