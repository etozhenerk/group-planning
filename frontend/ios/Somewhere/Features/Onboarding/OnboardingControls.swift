import SwiftUI

struct OnboardingControls: View {
    let selected: OnboardingSlide
    let choose: (OnboardingSlide) -> Void
    var authenticating = false
    var moving = false
    let next: () -> Void
    @Environment(\.dynamicTypeSize) private var typeSize
    var body: some View {
        VStack(spacing: DesignTokens.spaceS8) {
            OnboardingProgress(selected: selected, choose: choose)
                .frame(
                    width: DesignTokens.componentMobileOnboardingProgressSlotWidth
                        * CGFloat(OnboardingSlide.allCases.count),
                    height: DesignTokens.targetIos)
            if selected == .plans || typeSize >= .xxxLarge {
                VStack(spacing: DesignTokens.spaceS8) {
                    OnboardingNextButton(
                        final: selected == .plans, expanded: true, busy: authenticating,
                        action: next
                    ).disabled(selected == .plans && moving)
                    OnboardingBackButton(hidden: selected == .invitation, action: previous)
                }
            } else {
                HStack {
                    OnboardingBackButton(hidden: selected == .invitation, action: previous)
                    Spacer(minLength: DesignTokens.spaceS16)
                    OnboardingNextButton(final: false, busy: authenticating, action: next)
                }.frame(minHeight: DesignTokens.componentMobileOnboardingNextHeight)
            }
        }
        .padding(.horizontal, DesignTokens.componentMobileOnboardingInsetInline)
        .padding(.bottom, DesignTokens.spaceS16)
    }
    private func previous() {
        if let previous = OnboardingSlide(rawValue: selected.rawValue - 1) { choose(previous) }
    }
}
