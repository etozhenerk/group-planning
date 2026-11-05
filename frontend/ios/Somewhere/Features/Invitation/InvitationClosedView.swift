import SwiftUI

struct InvitationClosedView: View {
    let answer: RSVPAnswer?

    var body: some View {
        HStack(spacing: DesignTokens.spaceS12) {
            Image(systemName: "lock")
                .font(.system(size: DesignTokens.componentMobileInvitationClosedGlyph))
                .foregroundStyle(DesignTokens.colorMuted)
                .frame(
                    width: DesignTokens.componentMobileCalendarSelectionSize,
                    height: DesignTokens.componentMobileCalendarSelectionSize
                )
                .background(
                    DesignTokens.colorBackground,
                    in: RoundedRectangle(
                        cornerRadius: DesignTokens.componentMobileInvitationClosedIconRadius)
                ).accessibilityHidden(true)
            VStack(
                alignment: .leading, spacing: DesignTokens.componentMobileInvitationClosedCopyGap
            ) {
                Text("Участие закрыто")
                    .designFont(DesignTokens.typographySizeSmall, weight: .semibold)
                Text(
                    answer.map { "Вы ответили «\(RSVPLabels.title($0))»." }
                        ?? "Новых участников больше не принимают."
                )
                .designFont(DesignTokens.typographySizeCaption)
                .foregroundStyle(DesignTokens.colorMuted)
            }
        }
        .padding(DesignTokens.spaceS16).frame(maxWidth: .infinity, alignment: .leading)
        .background(
            DesignTokens.colorSurface,
            in: RoundedRectangle(cornerRadius: DesignTokens.radiusCover)
        )
        .overlay {
            RoundedRectangle(cornerRadius: DesignTokens.radiusCover)
                .strokeBorder(DesignTokens.colorLine, lineWidth: DesignTokens.spaceS1)
        }
        .padding(.bottom, DesignTokens.componentMobileInvitationClosedGap)
    }
}
