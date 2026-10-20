import SwiftUI

struct TaskExample: View {
    var body: some View {
        VStack(spacing: 14) {
            PreviewBadge(title: "Подготовка к встрече", symbol: "checklist")
            PreviewCard {
                HStack(alignment: .top, spacing: 16) {
                    Image(systemName: "takeoutbag.and.cup.and.straw.fill")
                        .font(.system(size: 29)).foregroundStyle(AppPalette.accent)
                        .frame(width: 52, height: 56)
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Заказать пиццу").font(.system(size: 22, weight: .bold)).tracking(-0.4)
                        Text("На всех, к семи вечера").font(.system(size: 13)).foregroundStyle(
                            AppPalette.muted)
                        Label("Миша принял задачу", systemImage: "checkmark.circle.fill")
                            .font(.system(size: 12, weight: .medium)).foregroundStyle(
                                AppPalette.accent)
                    }
                }
            }.rotationEffect(.degrees(2))
            HStack(spacing: 10) {
                Image(systemName: "square.dashed").foregroundStyle(AppPalette.muted)
                Text("Принести настолки").font(.system(size: 14))
                Spacer()
                Text("Пока без ответственного").font(.system(size: 10)).foregroundStyle(
                    AppPalette.muted)
            }.padding(16).background(
                AppPalette.surface.opacity(0.55), in: RoundedRectangle(cornerRadius: 18)
            )
            .padding(.horizontal, 12)
        }
    }
}
