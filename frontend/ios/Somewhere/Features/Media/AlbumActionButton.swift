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
                            width: DesignTokens.componentButtonIconSize,
                            height: DesignTokens.componentButtonIconSize
                        ).accessibilityHidden(true)
                } else if let icon {
                    ExperienceIcon(kind: icon, size: DesignTokens.componentButtonIconSize)
                }
                Text(title).multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .designFont(DesignTokens.typographySizeSmall, weight: .semibold)
            .padding(.horizontal, DesignTokens.spaceS12)
            .padding(.vertical, DesignTokens.spaceS10)
            .padding(DesignTokens.componentButtonBorderWidth)
            .frame(maxWidth: .infinity, minHeight: DesignTokens.componentButtonMinimumHeight)
            .frame(maxHeight: .infinity)
            .foregroundStyle(primary ? DesignTokens.colorActionText : DesignTokens.colorText)
            .background(
                primary ? DesignTokens.colorAction : Color.clear,
                in: RoundedRectangle(cornerRadius: DesignTokens.componentButtonRadius)
            )
            .overlay {
                RoundedRectangle(cornerRadius: DesignTokens.componentButtonRadius)
                    .strokeBorder(
                        primary ? Color.clear : DesignTokens.colorSubtleBorder,
                        lineWidth: DesignTokens.componentButtonBorderWidth)
            }
        }
        .buttonStyle(.plain).disabled(disabled)
        .accessibilityLabel(accessibleTitle)
        .accessibilityValue(busy ? "Выполняется" : "")
    }
}
