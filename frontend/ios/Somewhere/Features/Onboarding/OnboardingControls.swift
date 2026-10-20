import SwiftUI

struct OnboardingControls: View {
    let selected: OnboardingSlide
    let choose: (OnboardingSlide) -> Void
    let next: () -> Void
    @Environment(\.dynamicTypeSize) private var typeSize
    var body: some View {
        VStack(spacing: 12) {
            OnboardingProgress(selected: selected, choose: choose).frame(width: 150, height: 44)
            if typeSize >= .xxxLarge {
                VStack(spacing: 8) {
                    OnboardingNextButton(final: selected == .plans, expanded: true, action: next)
                    OnboardingBackButton(hidden: selected == .invitation, action: previous)
                }
            } else {
                HStack {
                    OnboardingBackButton(hidden: selected == .invitation, action: previous)
                    Spacer(minLength: 16)
                    OnboardingNextButton(final: selected == .plans, action: next)
                }.frame(minHeight: 56)
            }
        }
        .padding(.horizontal, 26).padding(.bottom, 16)
        .transaction { $0.animation = nil }
    }
    private func previous() {
        if let previous = OnboardingSlide(rawValue: selected.rawValue - 1) { choose(previous) }
    }
}
