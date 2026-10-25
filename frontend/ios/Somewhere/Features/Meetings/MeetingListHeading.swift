import SwiftUI

struct MeetingListHeading: View {
    let empty: Bool
    let create: () -> Void
    @ScaledMetric(relativeTo: .title) private var titleSize = 28.0

    var body: some View {
        ViewThatFits(in: .horizontal) {
            HStack {
                title.fixedSize()
                Spacer(minLength: 12)
                action
            }
            VStack(alignment: .leading, spacing: 16) {
                title
                action
            }
        }
    }

    private var title: some View {
        Text("Мои встречи").font(.system(size: titleSize, weight: .bold)).tracking(-0.9)
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
