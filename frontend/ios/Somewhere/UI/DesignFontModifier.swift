import SwiftUI

struct DesignFontModifier: ViewModifier {
    @ScaledMetric private var size: CGFloat
    let weight: Font.Weight
    nonisolated init(size: CGFloat, weight: Font.Weight, relativeTo: Font.TextStyle) {
        _size = ScaledMetric(wrappedValue: size, relativeTo: relativeTo)
        self.weight = weight
    }
    func body(content: Content) -> some View { content.font(.system(size: size, weight: weight)) }
}

extension View {
    nonisolated func designFont(
        _ size: CGFloat, weight: Font.Weight = .regular, relativeTo: Font.TextStyle = .body
    ) -> some View {
        modifier(DesignFontModifier(size: size, weight: weight, relativeTo: relativeTo))
    }
}
