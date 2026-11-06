import SwiftUI

struct ProfilePersonalRow: View {
    let title: String
    let value: String
    var last = false
    @Environment(\.dynamicTypeSize) private var typeSize
    var body: some View {
        Group {
            if typeSize.isAccessibilitySize {
                VStack(alignment: .leading, spacing: DesignTokens.spaceS8) {
                    label
                    text
                }
            } else {
                HStack(alignment: .top, spacing: DesignTokens.spaceS16) {
                    label.frame(
                        width: DesignTokens.componentMobileProfileDataLabelWidth,
                        alignment: .leading)
                    text.frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }.designFont(DesignTokens.typographySizeButton)
            .frame(
                maxWidth: .infinity, minHeight: DesignTokens.componentMobileProfileDataLineHeight,
                alignment: .leading
            )
            .padding(.vertical, DesignTokens.componentMobileProfileDataRowInsetBlock)
            .overlay(alignment: .bottom) {
                if !last {
                    Rectangle().fill(DesignTokens.colorLine).frame(height: DesignTokens.spaceS1)
                }
            }.accessibilityElement(children: .combine)
    }
    private var label: some View {
        Text(title).foregroundStyle(DesignTokens.colorMuted).fixedSize(
            horizontal: false, vertical: true)
    }
    private var text: some View {
        Text(value).fixedSize(horizontal: false, vertical: true)
    }
}
