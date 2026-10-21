import SwiftUI

struct BrandWordmark: View {
    var compact = false
    var loading = false
    @ScaledMetric(relativeTo: .title2) private var size = 25.0
    @ScaledMetric(relativeTo: .title2) private var tracking = -1.3

    private var fontSize: CGFloat { compact ? size * 23 / 25 : size }

    var body: some View {
        let xHeight = BrandTypography.xHeight(size: fontSize)

        HStack(alignment: .firstTextBaseline, spacing: 9) {
            BrandMark(animated: loading).frame(width: fontSize * 1.2, height: fontSize * 1.2)
                .alignmentGuide(.firstTextBaseline) { dimensions in
                    // Align the artwork with the visible lowercase letters, not the line box.
                    dimensions.height / 2 + xHeight / 2
                }
            Text("somewhere").lineLimit(1).minimumScaleFactor(0.8)
                .font(BrandTypography.font(size: fontSize))
                .tracking(tracking).accessibilityAddTraits(.isHeader)
        }
        .foregroundStyle(AppPalette.text).accessibilityElement(children: .combine)
        .accessibilityLabel("somewhere").accessibilityIdentifier("brand-wordmark")
    }
}
