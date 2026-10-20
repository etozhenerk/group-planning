import SwiftUI

struct OnboardingView: View {
    @State private var destination: OnboardingSlide = .invitation
    @State private var selected: OnboardingSlide = .invitation
    @State private var moving = false
    @State private var loginNotice = false

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                BrandWordmark(compact: true).dynamicTypeSize(...DynamicTypeSize.xxxLarge)
                Spacer(minLength: 16)
                OnboardingSkipButton(hidden: selected == .plans) { go(.plans) }
                    .disabled(moving)
            }.padding(.horizontal, 24).padding(.top, 8)
            GeometryReader { _ in
                OnboardingPager(destination: destination, settled: settle, moving: { moving = $0 })
            }.clipped()
            OnboardingControls(selected: selected, choose: go) {
                if let next = OnboardingSlide(rawValue: selected.rawValue + 1) {
                    go(next)
                } else {
                    loginNotice = true
                }
            }.disabled(moving)
        }
        .background(AppPalette.background.ignoresSafeArea())
        .alert("Вход ещё не подключён", isPresented: $loginNotice) {
            Button("Понятно", role: .cancel) {}
        } message: {
            Text("Яндекс ID подключим на заключительном этапе разработки.")
        }
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
