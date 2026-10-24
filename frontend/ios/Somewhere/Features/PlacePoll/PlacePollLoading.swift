import SwiftUI

struct PlacePollLoading: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            RoundedRectangle(cornerRadius: 5).frame(height: 22)
            RoundedRectangle(cornerRadius: 4).frame(width: 120, height: 12)
            HStack {
                RoundedRectangle(cornerRadius: 12).frame(height: 44)
                RoundedRectangle(cornerRadius: 12).frame(height: 44)
            }
        }.foregroundStyle(.primary.opacity(0.12))
            .accessibilityElement(children: .ignore).accessibilityLabel("Загрузка опроса")
    }
}
