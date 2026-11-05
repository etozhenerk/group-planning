import SwiftUI

struct CreationFieldHint: View {
    let text: String
    var body: some View {
        HStack(alignment: .top, spacing: DesignTokens.componentMobileFieldGap) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: DesignTokens.componentMobileCreationHintIconSize))
                .foregroundStyle(DesignTokens.colorError).accessibilityHidden(true)
            Text(text).designFont(DesignTokens.typographySizeCaption)
                .foregroundStyle(DesignTokens.colorMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}
