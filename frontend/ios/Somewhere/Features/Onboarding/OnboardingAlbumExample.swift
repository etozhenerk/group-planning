import SwiftUI

struct OnboardingAlbumExample: View {
    var body: some View {
        VStack(spacing: DesignTokens.spaceS16) {
            GeometryReader { geometry in
                ZStack(alignment: .topLeading) {
                    photo("OnboardingBoardgame")
                        .frame(
                            width: geometry.size.width
                                - DesignTokens.componentMobileOnboardingHeroPhotoTrailingSpace,
                            height: DesignTokens.componentMobileOnboardingHeroPhotoHeight
                        )
                        .rotationEffect(
                            .degrees(Double(DesignTokens.componentMobileOnboardingHeroPhotoAngle))
                        )
                        .offset(x: DesignTokens.spaceS4, y: DesignTokens.spaceS8)
                    photo("OnboardingDinner")
                        .frame(
                            width: DesignTokens.componentMobileOnboardingSecondPhotoWidth,
                            height: DesignTokens.componentMobileOnboardingSecondPhotoHeight
                        )
                        .rotationEffect(
                            .degrees(Double(DesignTokens.componentMobileOnboardingSecondPhotoAngle))
                        )
                        .offset(
                            x: geometry.size.width
                                - DesignTokens.componentMobileOnboardingSecondPhotoWidth,
                            y: DesignTokens.componentMobileOnboardingSecondPhotoTop)
                }
            }.frame(height: DesignTokens.componentMobileOnboardingPhotoStoryHeight)
            HStack {
                VStack(alignment: .leading, spacing: DesignTokens.spaceS4) {
                    Text("Настолки у Саши").font(.system(size: DesignTokens.typographySizeSmall))
                    Text("2 фотографии встречи").font(
                        .system(size: DesignTokens.typographySizeLabel)
                    ).foregroundStyle(DesignTokens.colorMuted)
                }
                Spacer()
                Label("Сохранить все", systemImage: "arrow.down.to.line").font(
                    .system(size: DesignTokens.typographySizeSmall))
            }
        }
    }
    private func photo(_ name: String) -> some View {
        GeometryReader { geometry in
            Image(name).resizable().scaledToFill().frame(
                width: geometry.size.width, height: geometry.size.height
            ).clipped()
                .clipShape(RoundedRectangle(cornerRadius: DesignTokens.radiusCover))
                .overlay(
                    RoundedRectangle(cornerRadius: DesignTokens.radiusCover).stroke(
                        DesignTokens.colorPhotoFrame,
                        lineWidth: DesignTokens.componentMobileOnboardingPhotoFrameWidth))
        }
    }
}
