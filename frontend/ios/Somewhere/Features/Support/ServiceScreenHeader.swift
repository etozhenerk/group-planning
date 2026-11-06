import SwiftUI

struct ServiceScreenHeader: View {
    let title: String
    var form = false
    let back: () -> Void
    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
            PageBackButton { back() }
            Text(title).designTokenFont(
                DesignTokens.componentMobileServiceTitleSize,
                weight: DesignTokens.componentMobileServiceTitleWeight, relativeTo: .title
            ).tracking(-DesignTokens.componentMobileServiceTitleTracking)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityAddTraits(.isHeader)
                .padding(.top, DesignTokens.componentMobileServiceHeadingGap)
            if form {
                (Text("* ").foregroundColor(DesignTokens.colorError) + Text("— обязательное поле"))
                    .designFont(DesignTokens.typographySizeCaption)
                    .foregroundStyle(DesignTokens.colorMuted).padding(.top, DesignTokens.spaceS10)
            }
        }.frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, DesignTokens.spaceS20)
            .padding(.bottom, DesignTokens.componentMobileServiceHeaderBottom)
    }
}
