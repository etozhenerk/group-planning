import SwiftUI

struct SettingsPickerButton: View {
    let title: String
    let symbol: String
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            HStack(spacing: DesignTokens.spaceS12) {
                Image(systemName: symbol).frame(width: DesignTokens.spaceS20)
                    .foregroundStyle(DesignTokens.colorMuted)
                Text(title).fixedSize(horizontal: false, vertical: true)
                Spacer(minLength: DesignTokens.spaceS0)
            }.actionField()
                .contentShape(Rectangle())
        }.buttonStyle(OnboardingPressStyle()).foregroundStyle(DesignTokens.colorText)
    }
}
