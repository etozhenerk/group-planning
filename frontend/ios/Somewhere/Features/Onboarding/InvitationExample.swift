import SwiftUI

struct InvitationExample: View {
    var body: some View {
        ZStack(alignment: .top) {
            Image("OnboardingBoardgame").resizable().scaledToFill()
                .frame(height: DesignTokens.componentMobileOnboardingInvitationPhotoHeight)
                .clipped()
                .clipShape(RoundedRectangle(cornerRadius: DesignTokens.radiusCover))
                .overlay(
                    RoundedRectangle(cornerRadius: DesignTokens.radiusCover).stroke(
                        DesignTokens.colorPhotoFrame,
                        lineWidth: DesignTokens.componentMobileOnboardingPhotoFrameWidth)
                )
                .rotationEffect(
                    .degrees(Double(DesignTokens.componentMobileOnboardingInvitationPhotoAngle))
                )
                .padding(.horizontal, DesignTokens.componentMobileOnboardingInvitationPhotoInset)
            OnboardingMeetingPreview().offset(
                y: DesignTokens.componentMobileOnboardingInvitationCardTop)
            HStack(spacing: DesignTokens.spaceS12) {
                ForEach(["Приду", "Возможно", "Не смогу"], id: \.self) { title in
                    Text(title).font(
                        .system(size: DesignTokens.typographySizeSmall, weight: .semibold)
                    )
                    .frame(maxWidth: .infinity, minHeight: DesignTokens.targetAndroid)
                    .foregroundStyle(
                        title == "Приду" ? DesignTokens.colorActionText : DesignTokens.colorText
                    )
                    .background(
                        title == "Приду" ? DesignTokens.colorAction : DesignTokens.colorBackground,
                        in: RoundedRectangle(cornerRadius: DesignTokens.componentButtonRadius)
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: DesignTokens.componentButtonRadius).stroke(
                            DesignTokens.colorBorderStrong, lineWidth: DesignTokens.spaceS1))
                }
            }.offset(y: DesignTokens.componentMobileOnboardingInvitationResponseTop)
        }.frame(height: DesignTokens.componentMobileOnboardingArtworkHeight, alignment: .top)
    }
}
