import SwiftUI

struct OnboardingMeetingPreview: View {
    var title = "Настолки у Саши"
    var coffee = false
    var first = false
    var photo = false
    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS8) {
            Text(title).font(
                .system(size: DesignTokens.typographySizeCardTitleMobile, weight: .bold)
            )
            .foregroundStyle(DesignTokens.colorText)
            .padding(.trailing, photo ? DesignTokens.componentCardCoverMobileWidth : 0)
            Label(coffee ? "Кофейня на углу" : "У Саши дома", systemImage: "mappin.and.ellipse")
                .font(.system(size: DesignTokens.typographySizeCaption)).foregroundStyle(
                    DesignTokens.colorMuted)
            Text("Москва").font(.system(size: DesignTokens.typographySizeLabel)).foregroundStyle(
                DesignTokens.colorMuted)
        }
        .padding(DesignTokens.spaceS16)
        .frame(
            maxWidth: .infinity, minHeight: DesignTokens.componentCardMinimumHeightMobile,
            alignment: .topLeading
        )
        .padding(.top, DesignTokens.spaceS12)
        .background(
            DesignTokens.colorWeekend, in: RoundedRectangle(cornerRadius: DesignTokens.radiusCard)
        )
        .overlay(alignment: .topLeading) {
            Text(coffee ? "Вс, 8 ноября · 12:00" : "Сб, 7 ноября · 19:00")
                .font(.system(size: DesignTokens.typographySizeLabel, weight: .semibold))
                .foregroundStyle(DesignTokens.colorWeekendText)
                .padding(.horizontal, DesignTokens.spaceS10).padding(
                    .vertical, DesignTokens.spaceS4
                )
                .background(
                    DesignTokens.colorWeekendBadge,
                    in: RoundedRectangle(cornerRadius: DesignTokens.radiusBadge)
                )
                .offset(x: DesignTokens.spaceS12, y: -DesignTokens.spaceS8)
        }
        .overlay(alignment: .topTrailing) {
            if photo {
                Image("OnboardingBoardgame").resizable().scaledToFill()
                    .frame(
                        width: DesignTokens.componentCardCoverMobileWidth,
                        height: DesignTokens.componentCardCoverMobileHeight
                    )
                    .clipped().clipShape(RoundedRectangle(cornerRadius: DesignTokens.radiusCover))
                    .overlay(
                        RoundedRectangle(cornerRadius: DesignTokens.radiusCover).stroke(
                            DesignTokens.colorPhotoFrame,
                            lineWidth: DesignTokens.componentMobileOnboardingPhotoFrameWidth)
                    )
                    .rotationEffect(
                        .degrees(Double(DesignTokens.componentMobileOnboardingSecondPhotoAngle))
                    )
                    .padding(.trailing, DesignTokens.spaceS12).offset(y: -DesignTokens.spaceS8)
            }
        }
        .overlay(alignment: .bottomTrailing) {
            HStack(spacing: -DesignTokens.spaceS8) {
                ForEach(0..<(first ? 1 : 3), id: \.self) { index in
                    ParticipantAvatar(
                        user: UserProfile(
                            id: UUID(
                                uuid: (
                                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, UInt8(index + 1)
                                )), displayName: "Участник", avatarURL: nil),
                        size: DesignTokens.componentCardAvatarMobile)
                }
                if !first {
                    Text("+3").font(.system(size: DesignTokens.typographySizeLabel)).padding(
                        DesignTokens.spaceS6)
                }
            }.padding(.trailing, DesignTokens.spaceS12).offset(y: DesignTokens.spaceS12)
        }
    }
}
