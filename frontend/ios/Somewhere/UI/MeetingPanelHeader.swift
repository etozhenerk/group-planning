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
            if !back { button }
        }.padding(.horizontal, 18).padding(.vertical, 8).foregroundStyle(AppPalette.text)
            .background(AppPalette.surface)
    }
    private var button: some View {
        Button(action: action) {
            Image(systemName: back ? "chevron.left" : "xmark").font(.system(size: 18))
                .frame(width: 44, height: 44).contentShape(Rectangle())
        }.buttonStyle(.plain).accessibilityLabel(back ? "Назад" : "Готово")
            .accessibilityIdentifier(back ? "settings-back" : "meeting-info-close")
    }
}
