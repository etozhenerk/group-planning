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
        Text("Мои встречи").font(.system(size: titleSize, weight: .bold))
            .accessibilityAddTraits(.isHeader)
    }

    @ViewBuilder private var action: some View {
        if !empty {
            Button(action: create) {
                Label("Создать", systemImage: "plus").font(.subheadline.weight(.semibold))
                    .padding(.horizontal, 14).frame(minHeight: 44)
                    .background(AppPalette.action, in: RoundedRectangle(cornerRadius: 14))
                    .foregroundStyle(AppPalette.actionText)
            }.buttonStyle(.plain).accessibilityLabel("Создать встречу")
        }
    }
}
