import SwiftUI

struct OnboardingView: View {
    @State private var destination: OnboardingSlide = .invitation
    @State private var selected: OnboardingSlide = .invitation
    @State private var moving = false
    var authenticating = false
    var signIn: () -> Void = {}

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                BrandWordmark(compact: true).dynamicTypeSize(...DynamicTypeSize.xxxLarge)
                Spacer(minLength: 16)
                OnboardingSkipButton(hidden: selected == .plans) { go(.plans) }
                    .disabled(moving || authenticating)
            }.padding(.horizontal, 24).padding(.top, 8)
            GeometryReader { _ in
                OnboardingPager(destination: destination, settled: settle, moving: { moving = $0 })
            }.clipped()
            OnboardingControls(selected: selected, choose: go, authenticating: authenticating) {
                if let next = OnboardingSlide(rawValue: selected.rawValue + 1) {
                    go(next)
                } else {
                    signIn()
                }
            }.disabled(moving || authenticating)
        }
        .background(AppPalette.background.ignoresSafeArea())

    }

    private func go(_ slide: OnboardingSlide) {
        guard !moving else { return }
        destination = slide
    }

    private func settle(_ slide: OnboardingSlide) {
        selected = slide
        destination = slide
    }
}
