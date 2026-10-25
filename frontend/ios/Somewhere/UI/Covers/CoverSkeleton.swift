import SwiftUI

struct CoverSkeleton: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var visible = false
    var body: some View {
        RoundedRectangle(cornerRadius: 14).fill(AppPalette.message)
            .opacity(reduceMotion || visible ? 1 : 0.45)
            .accessibilityElement().accessibilityLabel("Загрузка фото")
            .accessibilityIdentifier("cover-loading")
            .onAppear {
                guard !reduceMotion else { return }
                withAnimation(.easeInOut(duration: 1.6).repeatForever(autoreverses: true)) {
                    visible = true
                }
            }
    }
}
