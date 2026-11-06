import SwiftUI

struct SupportSectionPicker: View {
    @Bindable var owner: SupportOwner
    @State private var open = false
    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS10) {
            Text("Раздел приложения").designFont(
                DesignTokens.typographySizeSmall, weight: .semibold)
            Button {
                SystemKeyboard.dismiss()
                open = true
            } label: {
                HStack {
                    Text(
                        SupportSection(rawValue: owner.screen)?.title ?? SupportSection.other.title)
                    Spacer()
                    Image(systemName: "chevron.down").foregroundStyle(DesignTokens.colorMuted)
                }.designFont(DesignTokens.typographySizeMobileWebInput)
                    .padding(.horizontal, (DesignTokens.spaceS12 + DesignTokens.spaceS2))
                    .frame(minHeight: DesignTokens.componentMobileServiceFieldHeight)
                    .background(
                        DesignTokens.colorSurface,
                        in: RoundedRectangle(
                            cornerRadius: DesignTokens.componentMobileServiceFieldRadius)
                    )
                    .overlay {
                        RoundedRectangle(
                            cornerRadius: DesignTokens.componentMobileServiceFieldRadius
                        ).stroke(DesignTokens.colorBorderStrong, lineWidth: DesignTokens.spaceS1)
                    }
            }.buttonStyle(.plain).accessibilityLabel("Раздел приложения").accessibilityValue(
                SupportSection(rawValue: owner.screen)?.title ?? SupportSection.other.title
            )
            .accessibilityIdentifier("support-section-trigger")
        }.sheet(isPresented: $open) {
            ActionFormSheet(title: "Раздел приложения", scrollIdentifier: "support-section-scroll")
            {
                VStack(spacing: DesignTokens.spaceS4) {
                    ForEach(SupportSection.allCases) { section in
                        Button {
                            owner.screen = section.rawValue
                            open = false
                        } label: {
                            HStack(spacing: (DesignTokens.spaceS12 + DesignTokens.spaceS2)) {
                                Text(section.title).frame(maxWidth: .infinity, alignment: .leading)
                                if owner.screen == section.rawValue {
                                    Image(systemName: "checkmark").foregroundStyle(
                                        DesignTokens.colorAccent)
                                }
                            }.designFont(
                                DesignTokens.componentMobileSupportSectionOptionSize,
                                weight: owner.screen == section.rawValue ? .semibold : .regular
                            )
                            .padding(.horizontal, (DesignTokens.spaceS12 + DesignTokens.spaceS2))
                            .frame(
                                minHeight: DesignTokens.componentMobileSupportSectionOptionHeight
                            )
                            .background(
                                owner.screen == section.rawValue
                                    ? DesignTokens.colorBackground : .clear,
                                in: RoundedRectangle(cornerRadius: DesignTokens.spaceS12))
                        }.buttonStyle(.plain).accessibilityAddTraits(
                            owner.screen == section.rawValue ? .isSelected : [])
                    }
                }
            }
        }
    }
}
