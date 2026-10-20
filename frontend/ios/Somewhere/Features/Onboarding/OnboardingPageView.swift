import SwiftUI

struct OnboardingPageView: View {
    let slide: OnboardingSlide
    @ScaledMetric(relativeTo: .largeTitle) private var titleSize = 32.0
    var body: some View {
        GeometryReader { geometry in
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    OnboardingArtwork(slide: slide)
                        .frame(height: min(310, max(210, geometry.size.height * 0.51)))

                    VStack(alignment: .leading, spacing: 14) {
                        if slide.coming {
                            Text("Скоро").font(.caption.weight(.semibold))
                                .foregroundStyle(AppPalette.accent)
                        }
                        Text(slide.title).font(.system(size: titleSize, weight: .bold))
                            .tracking(-0.9).fixedSize(horizontal: false, vertical: true)
                            .accessibilityAddTraits(.isHeader)
                        Text(slide.text).font(.body).foregroundStyle(AppPalette.muted)
                            .lineSpacing(4).fixedSize(horizontal: false, vertical: true)
                        if slide == .plans {
                            Text("Вход через Яндекс ID").font(.footnote)
                                .foregroundStyle(AppPalette.muted)
                        }
                    }
                }
                .frame(maxWidth: 400).frame(minHeight: max(0, geometry.size.height - 40))
                .padding(.horizontal, 26).padding(.vertical, 20)
                .frame(maxWidth: .infinity)
            }
            .scrollBounceBehavior(.basedOnSize).scrollIndicators(.hidden)
        }
        .accessibilityIdentifier("onboarding-slide-\(slide.rawValue)")
    }
}
