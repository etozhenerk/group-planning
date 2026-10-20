import SwiftUI

struct PollExample: View {
    var body: some View {
        VStack(spacing: -12) {
            PreviewCard {
                VStack(alignment: .leading, spacing: 18) {
                    PreviewBadge(title: "Предложение Лены", symbol: "chart.bar.xaxis")
                    Text("А если у Саши?").font(.system(size: 24, weight: .bold)).tracking(-0.5)
                    Text("Там большой стол для настолок.").font(.system(size: 14))
                        .foregroundStyle(AppPalette.muted)
                    VStack(spacing: 10) {
                        HStack {
                            Text("За")
                            Spacer()
                            Text("3")
                        }
                        .font(.system(size: 14, weight: .semibold)).padding(12)
                        .background(
                            AppPalette.accent.opacity(0.22), in: RoundedRectangle(cornerRadius: 12))
                        HStack {
                            Text("Против")
                            Spacer()
                            Text("1")
                        }
                        .font(.system(size: 14)).padding(.horizontal, 12)
                        .foregroundStyle(AppPalette.muted)
                    }
                }
            }.rotationEffect(.degrees(-2))
            HStack {
                Spacer()
                PreviewBadge(title: "После опроса: у Саши", symbol: "mappin.and.ellipse")
                    .padding(7).background(AppPalette.background, in: Capsule())
            }
        }
    }
}
