import SwiftUI

struct DeclinedResponseScreen: View {
    let title: String
    let meetings: () -> Void

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: DesignTokens.componentRsvpResultMobileCardGap) {
                HStack(spacing: DesignTokens.spaceS8) {
                    Image("RefreshBrand").resizable().scaledToFit()
                        .frame(
                            width: DesignTokens.componentRsvpResultBrandMarkSize,
                            height: DesignTokens.componentRsvpResultBrandMarkSize
                        )
                        .clipShape(Circle()).accessibilityHidden(true)
                    Text("somewhere")
                        .designTokenFont(
                            DesignTokens.typographySizeMobileBrandWord,
                            weight: DesignTokens.componentRsvpResultBrandWeight
                        )
                        .tracking(-DesignTokens.componentRsvpResultBrandTracking)
                }.padding(.horizontal, DesignTokens.spaceS4)
                VStack(spacing: DesignTokens.spaceS0) {
                    Image(systemName: "checkmark")
                        .font(.system(size: DesignTokens.componentRsvpResultMobileIconGlyph))
                        .foregroundStyle(DesignTokens.colorAccent)
                        .frame(
                            width: DesignTokens.componentRsvpResultMobileIconSize,
                            height: DesignTokens.componentRsvpResultMobileIconSize
                        )
                        .background(DesignTokens.colorWeekday, in: Circle())
                        .accessibilityHidden(true)
                        .padding(.bottom, DesignTokens.spaceS24)
                    Text("Вы ответили «Не смогу»")
                        .designTokenFont(
                            DesignTokens.componentRsvpResultMobileHeadingSize,
                            weight: DesignTokens.typographyWeightMobileSheetTitle
                        )
                        .tracking(-DesignTokens.componentRsvpResultMobileHeadingTracking)
                        .accessibilityAddTraits(.isHeader)
                    Text(title).designFont(
                        DesignTokens.typographySizeSectionHeading, weight: .medium
                    )
                    .padding(.top, DesignTokens.spaceS20)
                    Text("Организатор увидит ваш ответ.")
                        .designFont(DesignTokens.typographySizeSmall)
                        .foregroundStyle(DesignTokens.colorMuted)
                        .padding(.top, DesignTokens.spaceS10)
                        .padding(.bottom, DesignTokens.componentRsvpResultCardPaddingBlock)
                    Button(action: meetings) {
                        Text("К моим встречам")
                            .designFont(DesignTokens.typographySizeButton, weight: .semibold)
                            .frame(maxWidth: .infinity, minHeight: DesignTokens.targetIos)
                            .padding(.vertical, DesignTokens.spaceS2)
                            .foregroundStyle(DesignTokens.colorActionText)
                            .background(
                                DesignTokens.colorAction,
                                in: RoundedRectangle(cornerRadius: DesignTokens.radiusControl))
                    }.buttonStyle(.plain)
                }
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.vertical, DesignTokens.componentRsvpResultCardPaddingBlock)
                .padding(.horizontal, DesignTokens.componentRsvpResultCardPaddingInline)
                .frame(maxWidth: .infinity)
                .background(
                    DesignTokens.colorSurface,
                    in: RoundedRectangle(cornerRadius: DesignTokens.radiusCard)
                )
                .overlay {
                    RoundedRectangle(cornerRadius: DesignTokens.radiusCard)
                        .stroke(DesignTokens.colorLine, lineWidth: DesignTokens.spaceS1)
                }
            }
            .padding(.horizontal, DesignTokens.spaceS16)
            .padding(.top, DesignTokens.spaceS12)
            .padding(.bottom, DesignTokens.spaceS32)
        }
        .background(DesignTokens.colorBackground)
        .toolbar(.hidden, for: .navigationBar)
        .accessibilityIdentifier("rsvp-declined")
    }
}
