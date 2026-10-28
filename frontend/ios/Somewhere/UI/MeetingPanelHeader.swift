import SwiftUI

struct MeetingPanelHeader: View {
    let title: String
    var back = false
    let action: () -> Void
    @ScaledMetric(relativeTo: .title2) private var titleSize = 22.0
    var body: some View {
        HStack(spacing: 8) {
            if back { button }
            Text(title).font(.system(size: titleSize, weight: .bold)).accessibilityAddTraits(
                .isHeader)
            Spacer(minLength: 4)
        }.padding(.horizontal, 18).padding(.vertical, 8).foregroundStyle(AppPalette.text)
            .background(AppPalette.surface)
    }
    private var button: some View {
        Button(action: action) {
            Image(systemName: "chevron.left").font(
                .system(size: DesignTokens.componentNavigationIcon)
            )
            .frame(width: 44, height: 44).contentShape(Rectangle())
        }.buttonStyle(.plain).accessibilityLabel("Назад")
            .accessibilityIdentifier("settings-back")
    }
}
