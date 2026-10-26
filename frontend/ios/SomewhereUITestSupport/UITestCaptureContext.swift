import SwiftUI
import UIKit

struct UITestCaptureContext: ViewModifier {
    @Environment(\.dynamicTypeSize) private var typeSize
    @Environment(\.locale) private var locale
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private var signature: String {
        "\(typeSize)|\(locale.identifier)|\(reduceMotion)"
    }

    func body(content: Content) -> some View {
        content.onChange(of: signature, initial: true) { _, _ in record() }
    }

    private func record() {
        guard let path = ProcessInfo.processInfo.environment["SOMEWHERE_UI_CAPTURE_CONTEXT"] else {
            return
        }
        let category = contentSizeCategory
        let traits = UITraitCollection(preferredContentSizeCategory: category)
        let font = UIFont.systemFont(ofSize: DesignTokens.typographySizeSmall)
        let heading = UIFont.systemFont(
            ofSize: DesignTokens.typographySizeMobileActionHeading, weight: .bold)
        let metadata: [String: Any] = [
            "capturedAt": ISO8601DateFormatter().string(from: Date()),
            "source": "SwiftUI environment in SomewhereUITestHost",
            "runtime": UIDevice.current.systemVersion,
            "os": ProcessInfo.processInfo.operatingSystemVersionString,
            "locale": locale.identifier,
            "timezone": TimeZone.current.identifier,
            "textScale": String(describing: typeSize),
            "contentSizeCategory": category.rawValue,
            "reducedMotion": reduceMotion,
            "fonts": [font.fontName, heading.fontName],
            "renderedFontSizes": [
                "small": UIFontMetrics(forTextStyle: .body).scaledFont(
                    for: font, compatibleWith: traits
                ).pointSize,
                "heading": UIFontMetrics(forTextStyle: .title1).scaledFont(
                    for: heading, compatibleWith: traits
                ).pointSize,
            ],
        ]
        do {
            let data = try JSONSerialization.data(
                withJSONObject: metadata, options: [.prettyPrinted, .sortedKeys])
            try data.write(to: URL(fileURLWithPath: path), options: .atomic)
        } catch {
            print("SOMEWHERE_CAPTURE_CONTEXT_ERROR=\(error)")
        }
    }

    private var contentSizeCategory: UIContentSizeCategory {
        switch typeSize {
        case .xSmall: .extraSmall
        case .small: .small
        case .medium: .medium
        case .large: .large
        case .xLarge: .extraLarge
        case .xxLarge: .extraExtraLarge
        case .xxxLarge: .extraExtraExtraLarge
        case .accessibility1: .accessibilityMedium
        case .accessibility2: .accessibilityLarge
        case .accessibility3: .accessibilityExtraLarge
        case .accessibility4: .accessibilityExtraExtraLarge
        case .accessibility5: .accessibilityExtraExtraExtraLarge
        @unknown default: .unspecified
        }
    }
}
