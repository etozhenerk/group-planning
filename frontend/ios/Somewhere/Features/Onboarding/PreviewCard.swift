import SwiftUI

struct PreviewCard<Content: View>: View {
    @ViewBuilder let content: () -> Content
    var body: some View {
        content().padding(20).frame(maxWidth: .infinity, alignment: .leading)
            .background(
                LinearGradient(
                    colors: [AppPalette.surface, AppPalette.message],
                    startPoint: .topLeading, endPoint: .bottomTrailing),
                in: RoundedRectangle(cornerRadius: 26)
            )
            .overlay(RoundedRectangle(cornerRadius: 26).stroke(.white.opacity(0.07), lineWidth: 1))
            .shadow(color: .black.opacity(0.17), radius: 20, y: 12)
    }
}
