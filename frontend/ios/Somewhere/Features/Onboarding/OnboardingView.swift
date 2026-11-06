import SwiftUI

struct OnboardingView: View {
    @State private var destination: OnboardingSlide = .invitation
    @State private var selected: OnboardingSlide = .invitation
    @State private var moving = false
    var authenticating = false
    var problem = false
    var signIn: () -> Void = {}

    var body: some View {
        VStack(spacing: 0) {
            OnboardingHeader(last: selected == .plans, busy: authenticating) { go(.plans) }
            GeometryReader { _ in
                OnboardingPager(
                    destination: destination, interactionEnabled: !authenticating, settled: settle,
                    moving: { moving = $0 })
            }.clipped()
            if problem {
                VStack(alignment: .leading, spacing: DesignTokens.spaceS4) {
                    Text("Не удалось открыть вход").font(
                        .system(size: DesignTokens.typographySizeSmall, weight: .semibold))
                    Text("Попробуйте ещё раз.").font(
                        .system(size: DesignTokens.typographySizeCaption))
                }.foregroundStyle(DesignTokens.colorError)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, DesignTokens.componentMobileOnboardingInsetInline)
                    .padding(.bottom, DesignTokens.spaceS8)
                    .accessibilityIdentifier("onboarding-auth-error")
            }
            OnboardingControls(
                selected: selected, choose: go, authenticating: authenticating, moving: moving
            ) {
                if selected != .plans {
                    go(
                        OnboardingSlide(
                            rawValue: min(destination.rawValue + 1, OnboardingSlide.plans.rawValue))
                            ?? .plans)
                } else if destination == .plans && !moving {
                    signIn()
                }
            }.fixedSize(horizontal: false, vertical: true).disabled(authenticating)
        }
        .background(DesignTokens.colorBackground.ignoresSafeArea())

    }

    private func go(_ slide: OnboardingSlide) {
        guard !authenticating else { return }
        destination = slide
    }

    private func settle(_ slide: OnboardingSlide) {
        selected = slide
        destination = slide
    }
}
