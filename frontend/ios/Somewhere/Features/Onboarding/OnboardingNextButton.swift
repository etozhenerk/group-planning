import SwiftUI
import UIKit

struct OnboardingNextButton: View {
    let final: Bool
    var expanded = false
    var busy = false
    let action: () -> Void
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @ScaledMetric(relativeTo: .body) private var fontSize = 17.0

    private var nextWidth: CGFloat { width(of: "Далее") }
    private var trialWidth: CGFloat { width(of: "Попробовать") }

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                ZStack {
                    title("Далее").opacity(final ? 0 : 1)
                    title("Попробовать").opacity(final ? 1 : 0)
                }
                .frame(width: expanded ? nil : (final ? trialWidth : nextWidth))
                Image(systemName: "arrow.right").font(.system(size: 17, weight: .semibold))
            }
            .opacity(busy ? 0 : 1)
            .frame(maxWidth: expanded ? .infinity : nil)
            .foregroundStyle(final ? AppPalette.actionText : AppPalette.text)
            .padding(.horizontal, 23).padding(.vertical, 16)
            .background(final ? AppPalette.action : AppPalette.surface, in: Capsule())
            .overlay {
                if busy { ProgressView().tint(AppPalette.actionText).accessibilityHidden(true) }
            }
            .animation(reduceMotion ? nil : .smooth(duration: 0.3), value: final)
            // Reserve the final width so the footer never reflows during the morph.
            .frame(width: expanded ? nil : trialWidth + 75, alignment: .trailing)
            .accessibilityElement(children: .ignore)
        }
        .accessibilityLabel(final ? "Попробовать" : "Далее")
        .buttonStyle(OnboardingPressStyle()).disabled(busy)
        .accessibilityValue(busy ? "Выполняется вход" : "")
    }

    private func title(_ text: String) -> some View {
        Text(text).font(.system(size: fontSize, weight: .semibold))
            .lineLimit(1).minimumScaleFactor(0.6)
            .fixedSize(horizontal: !expanded, vertical: false)
    }

    private func width(of text: String) -> CGFloat {
        ceil(
            (text as NSString).size(withAttributes: [
                .font: UIFont.systemFont(ofSize: fontSize, weight: .semibold)
            ]).width)
    }
}
