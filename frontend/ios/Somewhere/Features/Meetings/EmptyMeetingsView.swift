import SwiftUI

struct EmptyMeetingsView: View {
    var period: MeetingPeriod = .upcoming
    let create: () -> Void
    var body: some View {
        VStack(spacing: DesignTokens.spaceS0) {
            Image(systemName: "calendar.badge.plus")
                .font(.system(size: DesignTokens.componentMobileMeetingsEmptyGlyph))
                .foregroundStyle(AppPalette.accent).padding(.bottom, DesignTokens.spaceS12)
                .accessibilityHidden(true)
            Text(period == .past ? "Нет прошедших встреч" : "Нет предстоящих встреч")
                .designTokenFont(
                    DesignTokens.componentMobileStateTitleSize,
                    weight: DesignTokens.componentMobileStateTitleWeight, relativeTo: .title2
                )
                .tracking(-DesignTokens.componentMobileStateTitleTracking)
                .padding(.bottom, DesignTokens.spaceS10)
            Text(
                period == .past
                    ? "Перейдите к предстоящим, чтобы посмотреть ближайшие планы."
                    : "После создания встречи отправьте ссылку друзьям."
            )
            .designFont(DesignTokens.typographySizeButton).foregroundStyle(AppPalette.muted)
            .padding(.bottom, DesignTokens.spaceS24)
            if period != .past {
                Button(action: create) {
                    HStack(spacing: DesignTokens.spaceS8) {
                        ExperienceIcon(
                            kind: .plus, size: DesignTokens.componentMobileMeetingsCreateIconSize)
                        Text("Создать встречу").designFont(
                            DesignTokens.typographySizeSmall, weight: .semibold
                        )
                        .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(.horizontal, DesignTokens.componentMobileMeetingsEmptyActionInline)
                    .frame(minHeight: DesignTokens.targetIos)
                    .foregroundStyle(AppPalette.actionText)
                    .background(
                        AppPalette.action,
                        in: RoundedRectangle(cornerRadius: DesignTokens.componentButtonRadius))
                }.buttonStyle(.plain)
            }
        }
        .multilineTextAlignment(.center).frame(maxWidth: .infinity)
        .fixedSize(horizontal: false, vertical: true)
        .padding(.horizontal, DesignTokens.componentMobileMeetingsEmptyInset)
        .padding(.top, DesignTokens.componentMobileMeetingsEmptyTop)
        .accessibilityIdentifier("meetings-empty")
    }
}
