import SwiftUI
import UIKit

enum BrandTypography {
    // Web uses font-weight 850, midway between the system Heavy and Black weights.
    private static func uiFont(size: CGFloat) -> UIFont {
        let weight = (UIFont.Weight.heavy.rawValue + UIFont.Weight.black.rawValue) / 2
        return UIFont.systemFont(ofSize: size, weight: UIFont.Weight(rawValue: weight))
    }

    static func font(size: CGFloat) -> Font { Font(uiFont(size: size)) }

    static func xHeight(size: CGFloat) -> CGFloat { uiFont(size: size).xHeight }
}
