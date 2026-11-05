import SwiftUI

struct MeetingFailureView: View {
    let title: String
    let refresh: Bool
    let retry: () -> Void

    var body: some View {
        Group {
            if refresh {
                HStack(spacing: DesignTokens.spaceS10) {
                    Image(systemName: "icloud.slash")
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
                    .buttonStyle(.plain).accessibilityLabel("Повторить обновление")
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
                    Image(systemName: "icloud.slash")
                        .font(.system(size: DesignTokens.componentMobileStateLargeGlyphSize))
                        .frame(
                            width: DesignTokens.componentMobileStateLargeIconSize,
                            height: DesignTokens.componentMobileStateLargeIconSize
                        )
                        .foregroundStyle(AppPalette.muted)
                        .background(
                            AppPalette.background,
                            in: RoundedRectangle(
                                cornerRadius: DesignTokens.componentMobileStateLargeIconRadius)
                        )
                        .accessibilityHidden(true)
                        .padding(.bottom, DesignTokens.componentMobileStateLargeIconGap)
                    Text(title)
                        .designTokenFont(
                            DesignTokens.componentMobileStateTitleSize,
                            weight: DesignTokens.componentMobileStateTitleWeight,
                            relativeTo: .title2
                        )
                        .tracking(-DesignTokens.componentMobileStateTitleTracking)
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: DesignTokens.componentMobileStateLargeTitleWidth)
                        .accessibilityAddTraits(.isHeader).padding(.bottom, DesignTokens.spaceS24)
                    Button(action: retry) {
                        Label("Повторить загрузку", systemImage: "arrow.clockwise")
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
                .padding(.vertical, DesignTokens.spaceS32).padding(
                    .horizontal, DesignTokens.spaceS24
                )
                .background(
                    AppPalette.surface, in: RoundedRectangle(cornerRadius: DesignTokens.radiusCard)
                )
                .overlay {
                    RoundedRectangle(cornerRadius: DesignTokens.radiusCard)
                        .stroke(DesignTokens.colorLine, lineWidth: DesignTokens.spaceS1)
                }
                .padding(.top, DesignTokens.spaceS24)
            }
        }
        .accessibilityIdentifier("meetings-error")
    }
}
