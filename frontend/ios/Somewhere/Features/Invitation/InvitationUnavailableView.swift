import SwiftUI

struct InvitationUnavailableView: View {
    let retry: () -> Void

    var body: some View {
        VStack(spacing: DesignTokens.spaceS0) {
            Image(systemName: "icloud.slash")
                .font(.system(size: DesignTokens.componentMobileStateGlyphSize))
                .foregroundStyle(DesignTokens.colorAccent)
                .frame(
                    width: DesignTokens.componentMobileStateIconSize,
                    height: DesignTokens.componentMobileStateIconSize
                )
                .background(
                    DesignTokens.colorBackground,
                    in: RoundedRectangle(cornerRadius: DesignTokens.componentMobileStateIconRadius)
                )
                .accessibilityHidden(true)
                .padding(.bottom, DesignTokens.spaceS24)
            Text("Приглашение недоступно")
                .designTokenFont(
                    DesignTokens.componentInvitationStateUnavailableTitleSize,
                    weight: DesignTokens.componentMobileInvitationTitleWeight, relativeTo: .title2
                )
                .multilineTextAlignment(.center).accessibilityAddTraits(.isHeader)
                .padding(.bottom, DesignTokens.componentMobileInvitationTitleGap)
            ActionButton(title: "Повторить загрузку", symbol: "arrow.clockwise", action: retry)
                .designFont(DesignTokens.typographySizeSmall)
        }
        .padding(.vertical, DesignTokens.componentInvitationStateUnavailableInsetBlock)
        .padding(.horizontal, DesignTokens.componentInvitationStateUnavailableInsetInline)
        .frame(maxWidth: .infinity)
        .background(
            DesignTokens.colorSurface,
            in: RoundedRectangle(cornerRadius: DesignTokens.radiusCard)
        )
        .padding(.top, DesignTokens.componentInvitationStateUnavailableTopGap)
    }
}
