import SwiftUI

struct PreparationTaskLoading: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            RoundedRectangle(cornerRadius: 5).frame(height: 22)
            RoundedRectangle(cornerRadius: 4).frame(width: 140, height: 12)
            RoundedRectangle(cornerRadius: 12).frame(height: 44)
        }.foregroundStyle(.primary.opacity(0.12))
            .accessibilityElement(children: .ignore).accessibilityLabel("Загрузка задачи")
    }
}
