import SwiftUI

struct BrandWordmark: View {
    var compact = false
    @ScaledMetric(relativeTo: .title2) private var size = 25.0
    @ScaledMetric(relativeTo: .title2) private var tracking = -1.3

    private var fontSize: CGFloat {
        compact ? size * 21 / 25 : size
    }

    private var markSize: CGFloat {
        compact ? DesignTokens.componentMobileBrandMarkSize : fontSize * 1.2
    }

    private var gap: CGFloat {
        compact ? DesignTokens.componentMobileBrandGap : 9
    }

    var body: some View {
        let xHeight = BrandTypography.xHeight(size: fontSize)

        HStack(alignment: .firstTextBaseline, spacing: gap) {
            Group {
                if compact {
                    Image("RefreshBrand").resizable().scaledToFit()
                } else {
                    Image("BrandMark").renderingMode(.template).resizable().scaledToFit()
                }
            }.frame(width: markSize, height: markSize)
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
