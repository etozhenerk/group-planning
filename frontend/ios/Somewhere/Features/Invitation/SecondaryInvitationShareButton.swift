import SwiftUI

struct SecondaryInvitationShareButton: View {
    let url: URL
    let title: String

    var body: some View {
        ShareLink(item: url, preview: SharePreview(title)) {
            HStack(spacing: DesignTokens.componentButtonIconGap) {
                ExperienceIcon(kind: .share, size: DesignTokens.componentButtonIconSize)
                Text("Пригласить друзей").fixedSize(horizontal: false, vertical: true)
            }
            .designFont(DesignTokens.typographySizeButton, weight: .semibold)
            .foregroundStyle(DesignTokens.colorText)
            .padding(.horizontal, DesignTokens.componentButtonPaddingInline)
            .padding(.vertical, DesignTokens.componentButtonPaddingBlock)
            .frame(
                maxWidth: .infinity,
                minHeight: max(DesignTokens.componentButtonMinimumHeight, DesignTokens.targetIos)
            )
            .overlay {
                RoundedRectangle(cornerRadius: DesignTokens.componentButtonRadius)
                    .strokeBorder(DesignTokens.colorSubtleBorder, lineWidth: DesignTokens.spaceS1)
            }
            .contentShape(Rectangle())
        }.buttonStyle(.plain).accessibilityIdentifier("share-invitation")
    }
}
