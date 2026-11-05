import SwiftUI

struct FormSubmissionNotice: View {
    let title: String
    let explanation: String
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
                )
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: DesignTokens.componentInvitationNoticeCopyGap) {
                Text(title).designFont(DesignTokens.typographySizeSmall, weight: .semibold)
                Text(explanation).designFont(DesignTokens.typographySizeCaption)
                    .foregroundStyle(DesignTokens.colorMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }.frame(maxWidth: .infinity, alignment: .leading)
                .padding(.top, DesignTokens.componentInvitationNoticeCopyTop)
        }.padding(.horizontal, DesignTokens.componentInvitationNoticeOuterInset)
            .padding(.top, DesignTokens.componentInvitationNoticeOuterInset)
    }
}
