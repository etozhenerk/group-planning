import SwiftUI

struct BrandWordmark: View {
    var compact = false
    @ScaledMetric(relativeTo: .title2) private var size = 25.0
    @ScaledMetric(relativeTo: .title2) private var tracking = -1.3
    @ScaledMetric(relativeTo: .title2) private var markSize = 34.0
    var body: some View {
        HStack(spacing: 9) {
            Image("BrandMark").renderingMode(.template).resizable().scaledToFit()
                .frame(width: markSize, height: markSize).accessibilityHidden(true)
            Text("somewhere").lineLimit(1).minimumScaleFactor(0.8)
                .font(BrandTypography.font(size: compact ? size * 23 / 25 : size))
                .tracking(tracking).accessibilityAddTraits(.isHeader)
        }
        .foregroundStyle(AppPalette.text).accessibilityElement(children: .combine)
        .accessibilityLabel("somewhere").accessibilityIdentifier("brand-wordmark")
    }
}
