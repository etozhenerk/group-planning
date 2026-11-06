import SwiftUI

struct SupportSuccess: View {
    let reference: String
    let close: () -> Void
    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
            Image(systemName: "checkmark").font(
                .system(size: (DesignTokens.spaceS24 + DesignTokens.spaceS4))
            )
            .foregroundStyle(DesignTokens.colorAccent)
            .frame(
                width: DesignTokens.componentMobileSupportReceiptIconTile,
                height: DesignTokens.componentMobileSupportReceiptIconTile
            )
            .background(
                DesignTokens.colorBackground,
                in: RoundedRectangle(cornerRadius: DesignTokens.spaceS16)
            )
            .padding(.bottom, DesignTokens.spaceS24 + DesignTokens.spaceS4)
            Text("Обращение принято").designFont(
                DesignTokens.componentMobileSupportReceiptTitleSize, weight: .semibold
            )
            .accessibilityAddTraits(.isHeader).padding(
                .bottom, DesignTokens.spaceS24 + DesignTokens.spaceS2)
            Text("Номер обращения").designFont(DesignTokens.typographySizeCaption).foregroundStyle(
                DesignTokens.colorMuted
            )
            .padding(.bottom, DesignTokens.spaceS8)
            Text(reference).designFont(
                DesignTokens.componentMobileSupportReceiptNumberSize, weight: .medium
            ).monospacedDigit()
            Button(action: close) {
                Text("К помощи").designFont(DesignTokens.typographySizeBody, weight: .semibold)
                    .frame(
                        maxWidth: .infinity,
                        minHeight: DesignTokens.componentMobileServiceActionHeight
                    )
                    .foregroundStyle(DesignTokens.colorActionText)
                    .background(
                        DesignTokens.colorAction,
                        in: RoundedRectangle(
                            cornerRadius: DesignTokens.componentMobileServiceActionRadius))
            }.buttonStyle(.plain).padding(.top, DesignTokens.spaceS32)
        }.padding(.horizontal, DesignTokens.spaceS24).padding(
            .vertical, DesignTokens.spaceS24 + DesignTokens.spaceS4
        )
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            DesignTokens.colorSurface, in: RoundedRectangle(cornerRadius: DesignTokens.spaceS20)
        )
        .padding(.horizontal, DesignTokens.spaceS20).padding(.top, DesignTokens.spaceS20)
    }
}
