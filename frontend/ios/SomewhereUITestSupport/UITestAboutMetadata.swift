import SwiftUI

struct UITestAboutMetadata: ViewModifier {
    func body(content: Content) -> some View {
        let metadata: AboutMetadata =
            switch ProcessInfo.processInfo.environment[
                "SOMEWHERE_UI_ABOUT_METADATA"
            ] {
            case "local": .local
            case "unavailable": .unavailable
            default: .current
            }
        content.environment(\.aboutMetadata, metadata)
    }
}
