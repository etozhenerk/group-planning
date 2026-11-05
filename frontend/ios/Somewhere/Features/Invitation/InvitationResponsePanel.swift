import SwiftUI

struct InvitationResponsePanel<Content: View>: View {
    let content: Content

    init(@ViewBuilder content: () -> Content) { self.content = content() }

    var body: some View {
        content
            .padding(.horizontal, DesignTokens.spaceS20)
            .padding(.top, DesignTokens.componentMobileInvitationFooterInsetTop)
            .padding(.bottom, DesignTokens.spaceS12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background {
                UnevenRoundedRectangle(
                    topLeadingRadius: DesignTokens.radiusSheet,
                    topTrailingRadius: DesignTokens.radiusSheet
                )
                .fill(DesignTokens.colorSurface).ignoresSafeArea(edges: [.horizontal, .bottom])
                .shadow(
                    color: DesignTokens.colorMobileStickyShadow,
                    radius: DesignTokens.componentMobileStickyShadowBlur,
                    y: -DesignTokens.componentMobileStickyShadowUpOffset)
            }
    }
}
