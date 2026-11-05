import SwiftUI

struct MeetingListHeading: View {
    let empty: Bool
    let create: () -> Void
    @ScaledMetric(relativeTo: .title) private var titleSize = 28.0
    @Environment(\.dynamicTypeSize) private var typeSize

    var body: some View {
        if typeSize.isAccessibilitySize {
            VStack(alignment: .leading, spacing: DesignTokens.spaceS16) {
                title
                action
            }
        } else {
            HStack(spacing: DesignTokens.spaceS12) {
                title.frame(maxWidth: .infinity, alignment: .leading)
                action.fixedSize(horizontal: true, vertical: false)
            }
        }
    }

    private var title: some View {
        Text("Мои встречи").font(.system(size: titleSize, weight: .bold)).tracking(-0.9)
            .lineLimit(typeSize.isAccessibilitySize ? nil : 1)
            .minimumScaleFactor(
                DesignTokens.componentMobileMeetingsTitleMinimum
                    / DesignTokens.componentMobileMeetingsTitleMaximum
            )
            .accessibilityAddTraits(.isHeader)
    }

    @ViewBuilder private var action: some View {
        if !empty {
            Button(action: create) {
                HStack(spacing: 9) {
                    ExperienceIcon(kind: .plus)
                    Text("Создать")
                }.font(.system(size: 13, weight: .semibold))
                    .padding(.horizontal, 13).frame(minHeight: 44)
                    .background(AppPalette.action, in: RoundedRectangle(cornerRadius: 13))
                    .foregroundStyle(AppPalette.actionText)
            }.buttonStyle(.plain).accessibilityLabel("Создать встречу")
        }
    }
}
