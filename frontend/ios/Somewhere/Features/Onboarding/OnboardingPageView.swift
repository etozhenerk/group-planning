import SwiftUI

struct OnboardingPageView: View {
    let slide: OnboardingSlide
    @ScaledMetric(relativeTo: .largeTitle) private var titleSize = DesignTokens
        .typographySizeMobileOnboardingTitle
    @ScaledMetric(relativeTo: .body) private var bodySize = DesignTokens.typographySizeBody
    var body: some View {
        GeometryReader { geometry in
            ScrollView {
                VStack(
                    alignment: .leading, spacing: DesignTokens.componentMobileOnboardingArtworkGap
                ) {
                    if slide == .task {
                        TaskExample().environment(\.dynamicTypeSize, .medium)
                            .allowsHitTesting(false).accessibilityElement(children: .ignore)
                            .accessibilityLabel(slide.exampleLabel)
                    } else {
                        OnboardingArtwork(slide: slide)
                            .frame(
                                height: slide == .conversation
                                    ? DesignTokens.componentMobileOnboardingTallArtworkHeight
                                    : DesignTokens.componentMobileOnboardingArtworkHeight)
                    }
                    VStack(
                        alignment: .leading, spacing: DesignTokens.componentMobileOnboardingCopyGap
                    ) {
                        Text(slide.title)
                            .font(.system(size: titleSize, weight: .bold))
                            .tracking(-DesignTokens.componentMobileOnboardingTitleTracking)
                            .fixedSize(horizontal: false, vertical: true)
                            .accessibilityAddTraits(.isHeader)
                        Text(slide.text)
                            .font(.system(size: bodySize))
                            .foregroundStyle(DesignTokens.colorMuted)
                            .lineSpacing(
                                bodySize
                                    * (DesignTokens.typographyLineHeightMobileOnboardingBody - 1)
                            )
                            .fixedSize(horizontal: false, vertical: true)
                    }.frame(
                        minHeight: DesignTokens.componentMobileOnboardingCopyMinimumHeight,
                        alignment: .topLeading)
                }
                .padding(.horizontal, DesignTokens.componentMobileOnboardingInsetInline)
                .padding(.vertical, DesignTokens.spaceS16)
                .frame(minHeight: geometry.size.height, alignment: .top)
                .frame(maxWidth: .infinity)
            }
            .scrollBounceBehavior(.basedOnSize).scrollIndicators(.hidden)
        }.accessibilityIdentifier("onboarding-slide-\(slide.rawValue)")
    }
}
