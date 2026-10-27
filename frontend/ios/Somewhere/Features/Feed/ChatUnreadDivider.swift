import SwiftUI

struct ChatUnreadDivider: View {
    var body: some View {
        HStack(spacing: DesignTokens.spaceS12) {
            Rectangle().fill(DesignTokens.colorBorderStrong).frame(height: DesignTokens.spaceS1)
            Text("Непрочитанные").font(.caption).foregroundStyle(DesignTokens.colorMuted)
                .fixedSize()
            Rectangle().fill(DesignTokens.colorBorderStrong).frame(height: DesignTokens.spaceS1)
        }.padding(.vertical, DesignTokens.spaceS12)
    }
}
