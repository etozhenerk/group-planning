import SwiftUI

struct ProfileServiceRow: View {
    let title: String
    let symbol: String
    var divider = true
    var body: some View {
        HStack(spacing: DesignTokens.spaceS12 + DesignTokens.spaceS2) {
            Image(systemName: symbol).font(
                .system(size: DesignTokens.componentMobileProfileMenuIcon, weight: .light)
            )
            .frame(width: DesignTokens.componentMobileProfileMenuIcon).foregroundStyle(
                DesignTokens.colorMuted)
            Text(title).designFont(DesignTokens.typographySizeButton)
            Spacer(minLength: DesignTokens.spaceS8)
            Image(systemName: "chevron.right").font(
                .system(size: DesignTokens.componentMobileProfileMenuChevron, weight: .light)
            )
            .foregroundStyle(DesignTokens.colorMuted)
        }.frame(minHeight: DesignTokens.componentMobileProfileMenuRowHeight)
            .contentShape(Rectangle()).overlay(alignment: .bottom) {
                if divider {
                    Rectangle().fill(DesignTokens.colorLine).frame(height: DesignTokens.spaceS1)
                }
            }
    }
}
