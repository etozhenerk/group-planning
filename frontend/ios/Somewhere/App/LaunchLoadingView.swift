import SwiftUI

struct LaunchLoadingView: View {
    var body: some View {
        BrandWordmark(loading: true)
            .dynamicTypeSize(.large).scaleEffect(1.2)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(AppPalette.background.ignoresSafeArea())
            .accessibilityElement(children: .ignore)
            .accessibilityLabel("somewhere, приложение загружается")
            .accessibilityIdentifier("app-loading")
    }
}
