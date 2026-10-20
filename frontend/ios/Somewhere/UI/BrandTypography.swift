import SwiftUI
import UIKit

enum BrandTypography {
    // Web uses font-weight 850, midway between the system Heavy and Black weights.
    static func font(size: CGFloat) -> Font {
        let weight = (UIFont.Weight.heavy.rawValue + UIFont.Weight.black.rawValue) / 2
        return Font(UIFont.systemFont(ofSize: size, weight: UIFont.Weight(rawValue: weight)))
    }
}
