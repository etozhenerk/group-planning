import SwiftUI

struct CreationSubmissionFooter: View {
    let owner: CreationOwner
    private var label: String {
        owner.frozen
            ? "Повторить отправку" : owner.problem != nil ? "Попробовать снова" : "Создать встречу"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS12) {
            if let problem = owner.problem ?? owner.draftWarning {
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
                    VStack(
                        alignment: .leading, spacing: DesignTokens.componentInvitationNoticeCopyGap
                    ) {
                        Text(
                            owner.frozen
                                ? "Не удалось подтвердить создание" : "Не удалось создать встречу"
                        )
                        .designFont(DesignTokens.typographySizeSmall, weight: .semibold)
                        Text(
                            owner.frozen ? "Повторите отправку — данные менять не нужно." : problem
                        )
                        .designFont(DesignTokens.typographySizeCaption)
                        .foregroundStyle(DesignTokens.colorMuted)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                .accessibilityIdentifier("create-problem")
            }
            Button(action: owner.startSubmit) {
                Text(label).designFont(DesignTokens.typographySizeButton, weight: .semibold)
                    .fixedSize(horizontal: false, vertical: true)
                    .opacity(owner.busy ? 0 : 1)
                    .padding(.vertical, DesignTokens.spaceS12)
                    .padding(.horizontal, DesignTokens.spaceS16)
                    .frame(maxWidth: .infinity, minHeight: DesignTokens.targetAndroid)
                    .foregroundStyle(DesignTokens.colorActionText)
                    .background(
                        DesignTokens.colorAction,
                        in: RoundedRectangle(cornerRadius: DesignTokens.componentButtonRadius)
                    )
                    .overlay { if owner.busy { ProgressView().tint(DesignTokens.colorActionText) } }
            }
            .buttonStyle(.plain).disabled(owner.preparingCover || owner.busy)
            .accessibilityIdentifier("create-submit").accessibilityLabel(label)
        }
        .padding(.horizontal, DesignTokens.componentMobileStickyInsetInline)
        .padding(.top, DesignTokens.componentMobileStickyInsetTop)
        .padding(.bottom, DesignTokens.spaceS6)
        .background {
            UnevenRoundedRectangle(
                topLeadingRadius: DesignTokens.componentMobileStickyRadius,
                topTrailingRadius: DesignTokens.componentMobileStickyRadius
            )
            .fill(DesignTokens.colorSurface).ignoresSafeArea(edges: [.horizontal, .bottom])
            .shadow(
                color: DesignTokens.colorMobileStickyShadow,
                radius: DesignTokens.componentMobileStickyShadowBlur,
                y: -DesignTokens.componentMobileStickyShadowUpOffset)
        }
    }
}
