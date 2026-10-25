import SwiftUI

extension Color {
    init(designHex: UInt32, opacity: Double = 1) {
        self.init(
            .sRGB, red: Double((designHex >> 16) & 255) / 255,
            green: Double((designHex >> 8) & 255) / 255,
            blue: Double(designHex & 255) / 255, opacity: opacity)
    }
}
