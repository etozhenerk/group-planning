import SwiftUI

struct StatusView: View {
    let title: String
    var text: String? = nil
    var loading = false
    var retry: (() -> Void)? = nil
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            if loading { ProgressView().tint(AppPalette.accent) }
            Text(title).font(.title2.bold()).accessibilityAddTraits(.isHeader)
            if let text { Text(text).foregroundStyle(AppPalette.muted) }
            if let retry { ActionButton(title: "Попробовать ещё раз", action: retry) }
        }
        .frame(maxWidth: .infinity, alignment: .leading).padding(24)
        .accessibilityElement(children: .contain)
    }
}
