import SwiftUI

struct PlansExample: View {
    var body: some View {
        PreviewCard {
            VStack(alignment: .leading, spacing: 20) {
                HStack {
                    Text("Мои встречи").font(.system(size: 20, weight: .bold))
                    Spacer()
                    Image(systemName: "plus").foregroundStyle(AppPalette.accent)
                }
                HStack(spacing: 8) {
                    Text("Список").foregroundStyle(AppPalette.text)
                    Text("Календарь · скоро").foregroundStyle(AppPalette.muted)
                }.font(.system(size: 11, weight: .medium))
                HStack(spacing: 13) {
                    VStack {
                        Text("24").font(.system(size: 25, weight: .bold))
                        Text("СБ").font(.system(size: 10))
                    }
                    .frame(width: 52, height: 61).foregroundStyle(AppPalette.accent)
                    .background(
                        AppPalette.accent.opacity(0.12), in: RoundedRectangle(cornerRadius: 15))
                    VStack(alignment: .leading, spacing: 7) {
                        Text("Суббота без спешки").font(.system(size: 14, weight: .semibold))
                        Text("19:00 · У Саши").font(.system(size: 12)).foregroundStyle(
                            AppPalette.muted)
                    }
                }
                Divider().overlay(AppPalette.border)
                HStack(spacing: 13) {
                    VStack {
                        Text("25").font(.system(size: 25, weight: .bold))
                        Text("ВС").font(.system(size: 10))
                    }
                    .frame(width: 52, height: 61).foregroundStyle(AppPalette.muted)
                    VStack(alignment: .leading, spacing: 7) {
                        Text("Кофе в воскресенье").font(.system(size: 14, weight: .semibold))
                        Text("12:00 · Кофейня на углу").font(.system(size: 12)).foregroundStyle(
                            AppPalette.muted)
                    }
                }
            }
        }.rotationEffect(.degrees(-1.5))
    }
}
