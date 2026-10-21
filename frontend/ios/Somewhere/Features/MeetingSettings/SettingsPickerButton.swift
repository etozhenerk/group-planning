import SwiftUI

struct SettingsPickerButton: View {
    let title: String
    let symbol: String
    let action: () -> Void
    @ScaledMetric(relativeTo: .body) private var textSize = 16.0
    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: symbol).frame(width: 20).foregroundStyle(AppPalette.muted)
                Text(title).font(.system(size: textSize))
                Spacer(minLength: 0)
            }.padding(.horizontal, 14).frame(minHeight: 48)
                .background(Color("SettingsField"), in: RoundedRectangle(cornerRadius: 13))
                .contentShape(Rectangle())
        }.buttonStyle(OnboardingPressStyle()).foregroundStyle(AppPalette.text)
    }
}
