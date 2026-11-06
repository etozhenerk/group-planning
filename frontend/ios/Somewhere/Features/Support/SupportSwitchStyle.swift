import SwiftUI

struct SupportSwitchStyle: ToggleStyle {
    func makeBody(configuration: Configuration) -> some View {
        Button {
            configuration.isOn.toggle()
        } label: {
            HStack(spacing: DesignTokens.spaceS16) {
                configuration.label.frame(maxWidth: .infinity, alignment: .leading)
                ZStack(alignment: .leading) {
                    Capsule().fill(
                        configuration.isOn
                            ? DesignTokens.colorAccent : DesignTokens.colorBorderStrong)
                    Circle().fill(
                        configuration.isOn ? DesignTokens.colorBackground : DesignTokens.colorText
                    )
                    .frame(
                        width: DesignTokens.componentMobileSupportSwitchThumb,
                        height: DesignTokens.componentMobileSupportSwitchThumb
                    )
                    .offset(
                        x: DesignTokens.spaceS3
                            + (configuration.isOn
                                ? DesignTokens.componentMobileSupportSwitchTravel : 0))
                }.frame(
                    width: DesignTokens.componentMobileSupportSwitchWidth,
                    height: DesignTokens.componentMobileSupportSwitchHeight
                )
                .frame(width: DesignTokens.targetIos, height: DesignTokens.targetIos)
            }.frame(minHeight: DesignTokens.componentMobileSupportSwitchRowHeight).contentShape(
                Rectangle())
        }.buttonStyle(.plain).accessibilityValue(configuration.isOn ? "Включено" : "Выключено")
    }
}
