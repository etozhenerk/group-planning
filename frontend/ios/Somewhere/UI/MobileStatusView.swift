import SwiftUI

struct MobileStatusView: View {
    let title: String
    let refresh: Bool
    let retry: () -> Void
    var large = true
    var symbol = "icloud.slash"
    var actionLabel: String?
    var actionSymbol: String? = "arrow.clockwise"

    var body: some View {
        Group {
            if refresh {
                HStack(spacing: DesignTokens.spaceS10) {
                    Image(systemName: symbol)
                        .font(.system(size: DesignTokens.componentMobileStateRefreshGlyphSize))
                        .accessibilityHidden(true)
                    Text(title).designFont(DesignTokens.typographySizeCaption)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    Button(action: retry) {
                        Image(systemName: "arrow.clockwise")
                            .font(
                                .system(
                                    size: DesignTokens.componentMobileStateRefreshActionGlyphSize)
                            )
                            .frame(width: DesignTokens.targetIos, height: DesignTokens.targetIos)
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain).accessibilityLabel(actionLabel ?? "Повторить обновление")
                    .background(
                        DesignTokens.colorRaised,
                        in: RoundedRectangle(
                            cornerRadius: DesignTokens.componentMobileStateRefreshActionRadius))
                }
                .foregroundStyle(AppPalette.muted)
                .padding(DesignTokens.spaceS8)
                .padding(.leading, DesignTokens.spaceS6)
                .background(
                    AppPalette.surface,
                    in: RoundedRectangle(
                        cornerRadius: DesignTokens.componentMobileStateRefreshRadius)
                )
                .padding(.bottom, DesignTokens.spaceS20)
            } else {
                VStack(spacing: DesignTokens.spaceS0) {
                    Image(systemName: symbol)
                        .font(
                            .system(
                                size: (large
                                    ? DesignTokens.componentMobileStateLargeGlyphSize
                                    : DesignTokens.componentMobileStateGlyphSize))
                        )
                        .frame(
                            width: (large
                                ? DesignTokens.componentMobileStateLargeIconSize
                                : DesignTokens.componentMobileStateIconSize),
                            height: (large
                                ? DesignTokens.componentMobileStateLargeIconSize
                                : DesignTokens.componentMobileStateIconSize)
                        )
                        .foregroundStyle(large ? AppPalette.muted : AppPalette.accent)
                        .background(
                            AppPalette.background,
                            in: RoundedRectangle(
                                cornerRadius: (large
                                    ? DesignTokens.componentMobileStateLargeIconRadius
                                    : DesignTokens.componentMobileStateIconRadius))
                        )
                        .accessibilityHidden(true)
                        .padding(
                            .bottom,
                            large
                                ? DesignTokens.componentMobileStateLargeIconGap
                                : DesignTokens.spaceS20)
                    Text(title)
                        .designTokenFont(
                            (large
                                ? DesignTokens.componentMobileStateTitleSize
                                : DesignTokens.componentMobileStateCompactTitleSize),
                            weight: DesignTokens.componentMobileStateTitleWeight,
                            relativeTo: .title2
                        )
                        .tracking(-DesignTokens.componentMobileStateTitleTracking)
                        .multilineTextAlignment(.center)
                        .frame(
                            maxWidth: large
                                ? DesignTokens.componentMobileStateLargeTitleWidth : .infinity
                        )
                        .accessibilityAddTraits(.isHeader).padding(.bottom, DesignTokens.spaceS24)
                    Button(action: retry) {
                        HStack(spacing: DesignTokens.spaceS8) {
                            if let actionSymbol {
                                Image(systemName: actionSymbol).accessibilityHidden(true)
                            }
                            Text(actionLabel ?? "Повторить загрузку")
                        }
                        .designFont(DesignTokens.typographySizeSmall, weight: .semibold)
                        .frame(
                            maxWidth: .infinity,
                            minHeight: DesignTokens.componentMobileStateActionMinimumHeight
                        )
                        .foregroundStyle(AppPalette.actionText)
                        .background(
                            AppPalette.action,
                            in: RoundedRectangle(
                                cornerRadius: DesignTokens.componentButtonRadius)
                        )
                    }.buttonStyle(.plain)
                }
                .frame(maxWidth: .infinity)
                .padding(
                    .vertical,
                    large ? DesignTokens.spaceS32 : DesignTokens.componentMobileStatePanelInsetBlock
                ).padding(
                    .horizontal,
                    large
                        ? DesignTokens.spaceS24 : DesignTokens.componentMobileStatePanelInsetInline
                )
                .background(
                    AppPalette.surface, in: RoundedRectangle(cornerRadius: DesignTokens.radiusCard)
                )
                .overlay {
                    RoundedRectangle(cornerRadius: DesignTokens.radiusCard)
                        .stroke(DesignTokens.colorLine, lineWidth: DesignTokens.spaceS1)
                }
                .padding(.top, large ? DesignTokens.spaceS24 : DesignTokens.spaceS20)
            }
        }
        .accessibilityIdentifier("mobile-status")
    }
}
