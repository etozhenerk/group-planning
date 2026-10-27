import SwiftUI
import UIKit

struct DesignTokenFontModifier: ViewModifier {
    @ScaledMetric private var size: CGFloat
    let weight: Int

    init(size: CGFloat, weight: Int, relativeTo: Font.TextStyle) {
        _size = ScaledMetric(wrappedValue: size, relativeTo: relativeTo)
        self.weight = weight
    }

    func body(content: Content) -> some View {
        let fraction =
            CGFloat(weight - DesignTokens.typographyWeightSemibold)
            / CGFloat(DesignTokens.typographyWeightBold - DesignTokens.typographyWeightSemibold)
        let value =
            UIFont.Weight.semibold.rawValue
            + fraction * (UIFont.Weight.bold.rawValue - UIFont.Weight.semibold.rawValue)
        content.font(Font(UIFont.systemFont(ofSize: size, weight: UIFont.Weight(rawValue: value))))
    }
}

extension View {
    func designTokenFont(_ size: CGFloat, weight: Int, relativeTo: Font.TextStyle = .body)
        -> some View
    {
        modifier(DesignTokenFontModifier(size: size, weight: weight, relativeTo: relativeTo))
    }
}
