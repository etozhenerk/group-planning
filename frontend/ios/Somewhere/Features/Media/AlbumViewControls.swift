import SwiftUI

struct AlbumViewControls: View {
    let selection: Int
    let count: Int
    @Binding var grid: Bool
    @ScaledMetric(relativeTo: .body) private var counterSize = DesignTokens
        .componentMobileVibeCounterSize
    @ScaledMetric(relativeTo: .caption) private var totalSize = DesignTokens.typographySizeCaption
    var body: some View {
        HStack(spacing: DesignTokens.spaceS12) {
            (Text("\(min(selection + 1, count))").font(
                .system(size: counterSize))
                + Text(" / \(count)").font(.system(size: totalSize))
                .foregroundColor(DesignTokens.colorMuted))
                .monospacedDigit().frame(
                    minWidth: DesignTokens.componentMobileVibeCounterMinimumWidth,
                    alignment: .trailing
                )
                .accessibilityLabel("\(min(selection + 1, count)) из \(count)")
                .accessibilityAddTraits(.updatesFrequently)
            Button {
                grid.toggle()
            } label: {
                ExperienceIcon(
                    kind: grid ? .layers : .grid, size: DesignTokens.componentMobileVibeViewIconSize
                )
                .frame(width: DesignTokens.targetIos, height: DesignTokens.targetIos).contentShape(
                    Rectangle())
            }.buttonStyle(.plain).foregroundStyle(DesignTokens.colorMuted)
                .accessibilityLabel(grid ? "Показать стопкой" : "Показать сеткой")
        }.frame(minHeight: DesignTokens.targetIos).accessibilityIdentifier("album-view-controls")
    }
}
