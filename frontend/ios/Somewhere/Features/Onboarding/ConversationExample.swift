import SwiftUI

struct ConversationExample: View {
    var body: some View {
        PreviewCard {
            VStack(alignment: .leading, spacing: 18) {
                HStack {
                    Text("Суббота без спешки").font(.system(size: 15, weight: .semibold))
                    Spacer()
                    Image(systemName: "ellipsis").foregroundStyle(AppPalette.muted)
                }
                Divider().overlay(AppPalette.border)
                HStack(alignment: .top, spacing: 9) {
                    Text("Л").font(.system(size: 12, weight: .bold))
                        .frame(width: 29, height: 29).foregroundStyle(AppPalette.actionText)
                        .background(AppPalette.accent, in: Circle())
                    VStack(alignment: .leading, spacing: 5) {
                        Text("Лена").font(.system(size: 11, weight: .semibold)).foregroundStyle(
                            AppPalette.accent)
                        Text("Может, соберёмся у Саши?\nУ него большой стол.")
                            .font(.system(size: 14)).padding(12)
                            .background(
                                AppPalette.background.opacity(0.7),
                                in: RoundedRectangle(cornerRadius: 17))
                    }
                }
                HStack {
                    Spacer(minLength: 18)
                    Text("Настолки возьму!").font(.system(size: 14)).padding(12)
                        .foregroundStyle(AppPalette.actionText)
                        .background(AppPalette.accent, in: RoundedRectangle(cornerRadius: 17))
                }
                Text("Лена придёт").font(.system(size: 11)).foregroundStyle(AppPalette.muted)
                    .frame(maxWidth: .infinity)
            }
        }.rotationEffect(.degrees(1.5))
    }
}
