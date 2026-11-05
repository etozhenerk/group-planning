import SwiftUI

struct AlbumActionButton: View {
    let title: String
    let accessibleTitle: String
    var icon: ExperienceIcon.Kind? = nil
    var primary = false
    var busy = false
    var disabled = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: DesignTokens.componentButtonIconGap) {
                if busy {
                    ProgressView().controlSize(.small).tint(DesignTokens.colorText)
                        .frame(
                            width: DesignTokens.componentMobileFieldIconSize,
                            height: DesignTokens.componentMobileFieldIconSize
                        ).accessibilityHidden(true)
                } else if let icon {
                    ExperienceIcon(kind: icon, size: DesignTokens.componentMobileFieldIconSize)
                }
                Text(title).multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .designFont(DesignTokens.typographySizeSmall, weight: .semibold)
            .padding(.horizontal, DesignTokens.componentMobileVibeActionInsetInline)
            .padding(.vertical, DesignTokens.componentMobileVibeActionInsetBlock)
            .padding(DesignTokens.componentButtonBorderWidth)
            .frame(
                maxWidth: .infinity, minHeight: DesignTokens.componentMobileVibeActionMinimumHeight
            )
            .frame(maxHeight: .infinity)
            .foregroundStyle(primary ? DesignTokens.colorActionText : DesignTokens.colorText)
            .background(
                primary ? DesignTokens.colorAction : DesignTokens.colorSurface,
                in: RoundedRectangle(cornerRadius: DesignTokens.componentMobileVibeActionRadius)
            )
            .overlay {
                RoundedRectangle(cornerRadius: DesignTokens.componentMobileVibeActionRadius)
                    .strokeBorder(
                        primary ? Color.clear : DesignTokens.colorBorderStrong,
                        lineWidth: DesignTokens.componentButtonBorderWidth)
            }
        }
        .buttonStyle(.plain).disabled(disabled)
        .accessibilityLabel(accessibleTitle)
        .accessibilityValue(busy ? "Выполняется" : "")
    }
}
