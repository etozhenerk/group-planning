import SwiftUI

struct InvitationNoticeView: View {
    let error: String

    var body: some View {
        HStack(alignment: .top, spacing: DesignTokens.componentInvitationNoticeGap) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: DesignTokens.componentInvitationNoticeGlyphSize))
                .foregroundStyle(DesignTokens.colorError)
                .frame(
                    width: DesignTokens.componentInvitationNoticeIconSize,
                    height: DesignTokens.componentInvitationNoticeIconSize
                )
                .background(
                    DesignTokens.colorInvitationNoticeBackground,
                    in: RoundedRectangle(
                        cornerRadius: DesignTokens.componentInvitationNoticeIconRadius)
                ).accessibilityHidden(true)
            VStack(alignment: .leading, spacing: DesignTokens.componentInvitationNoticeCopyGap) {
                Text("Не удалось отправить ответ")
                    .designFont(DesignTokens.typographySizeSmall, weight: .semibold)
                Text(error).designFont(DesignTokens.typographySizeCaption)
                    .foregroundStyle(DesignTokens.colorMuted).accessibilityIdentifier("rsvp-error")
            }.padding(.top, DesignTokens.componentInvitationNoticeCopyTop)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, DesignTokens.componentInvitationNoticeOuterInset)
        .padding(.top, DesignTokens.componentInvitationNoticeOuterInset)
        .padding(.bottom, DesignTokens.componentInvitationNoticeBottomSpace)
    }
}
