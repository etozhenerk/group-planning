import SwiftUI

struct OnboardingBackButton: View {
    let hidden: Bool
    let action: () -> Void
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: "chevron.left").font(.system(size: 15, weight: .medium))
                    .accessibilityHidden(true)
                Text("Назад").font(.subheadline.weight(.medium)).lineLimit(1)
            }
            .foregroundStyle(AppPalette.muted).frame(minHeight: 44).padding(.trailing, 12)
        }
        .opacity(hidden ? 0 : 1)
        .offset(x: reduceMotion || !hidden ? 0 : -6)
        .animation(reduceMotion ? nil : .smooth(duration: 0.25), value: hidden)
        .disabled(hidden).accessibilityHidden(hidden)
        .accessibilityLabel("Предыдущий слайд").buttonStyle(OnboardingPressStyle())
    }
}
