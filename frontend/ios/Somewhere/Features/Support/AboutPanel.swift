import SwiftUI

struct AboutPanel: View {
    @Environment(\.aboutMetadata) private var metadata
    @ScaledMetric private var descriptionSize = DesignTokens.typographySizeButton
    @ScaledMetric private var descriptionLine = DesignTokens
        .componentMobileAboutBrandDescriptionLineHeight
    @ScaledMetric private var metadataLine = DesignTokens.componentMobileServiceBodyLineHeight
    private var descriptionGap: CGFloat {
        max(0, descriptionLine - UIFont.systemFont(ofSize: descriptionSize).lineHeight)
    }
    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
            HStack(spacing: DesignTokens.spaceS12) {
                Image("RefreshBrand").resizable()
                    .frame(
                        width: DesignTokens.componentMobileAboutBrandMarkSize,
                        height: DesignTokens.componentMobileAboutBrandMarkSize
                    )
                    .accessibilityHidden(true)
                Text("somewhere").designTokenFont(
                    DesignTokens.componentMobileAboutBrandWordSize,
                    weight: DesignTokens.componentRsvpResultBrandWeight, relativeTo: .largeTitle
                )
                .tracking(-DesignTokens.componentMobileAboutBrandWordTracking)
            }.padding(.top, DesignTokens.spaceS10)
            Text("Договориться о встрече, обсудить детали и сохранить её вайб.")
                .font(.system(size: descriptionSize)).lineSpacing(descriptionGap)
                .padding(.vertical, descriptionGap / 2).foregroundStyle(
                    DesignTokens.colorMuted
                )
                .fixedSize(horizontal: false, vertical: true)
                .frame(
                    maxWidth: DesignTokens.componentMobileAboutBrandDescriptionMaximumWidth,
                    alignment: .leading
                )
                .padding(.top, DesignTokens.spaceS16 + DesignTokens.spaceS2)
                .padding(.bottom, DesignTokens.spaceS24 + DesignTokens.spaceS6)
            VStack(spacing: DesignTokens.spaceS0) {
                row("Приложение", value: "iOS")
                row(
                    "Версия", value: metadata.versionLabel, last: metadata.build == nil)
                if let build = metadata.build { row("Сборка", value: build, last: true) }
            }.padding(.horizontal, DesignTokens.componentMobileAboutMetadataInsetInline)
                .padding(.vertical, DesignTokens.spaceS4)
                .background(
                    DesignTokens.colorSurface,
                    in: RoundedRectangle(
                        cornerRadius: DesignTokens.componentMobileAboutMetadataRadius))
            (Text("Developed by ").foregroundColor(DesignTokens.colorMuted)
                + Text("MintyDev").fontWeight(.semibold))
                .designFont(DesignTokens.typographySizeCaption).padding(
                    .top, DesignTokens.componentMobileAboutCreditTop)
        }.padding(.horizontal, DesignTokens.spaceS20).padding(.bottom, DesignTokens.spaceS40)
    }
    private func row(_ title: String, value: String, last: Bool = false) -> some View {
        VStack(spacing: DesignTokens.spaceS0) {
            HStack(alignment: .firstTextBaseline, spacing: DesignTokens.spaceS20) {
                Text(title).foregroundStyle(DesignTokens.colorMuted)
                Spacer(minLength: DesignTokens.spaceS0)
                Text(value).multilineTextAlignment(.trailing).monospacedDigit()
            }.designFont(DesignTokens.typographySizeSmall).frame(minHeight: metadataLine)
                .padding(.vertical, DesignTokens.spaceS16)
            if !last {
                Rectangle().fill(DesignTokens.colorLine).frame(height: DesignTokens.spaceS1)
            }
        }
    }
}
