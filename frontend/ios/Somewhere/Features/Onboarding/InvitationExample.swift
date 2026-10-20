import SwiftUI

struct InvitationExample: View {
    var body: some View {
        VStack(spacing: -12) {
            PreviewCard {
                VStack(alignment: .leading, spacing: 18) {
                    HStack {
                        Image(systemName: "sparkles").font(.system(size: 27, weight: .medium))
                            .foregroundStyle(AppPalette.accent).frame(width: 54, height: 54)
                            .background(
                                AppPalette.accent.opacity(0.12),
                                in: RoundedRectangle(cornerRadius: 18))
                        Spacer()
                        Image(systemName: "arrow.up.right").foregroundStyle(AppPalette.muted)
                    }
                    Text("Суббота без спешки").font(.system(size: 23, weight: .bold)).tracking(-0.5)
                    Label("24 октября · 19:00", systemImage: "calendar").font(.system(size: 14))
                    Label("У Саши", systemImage: "mappin.and.ellipse").font(.system(size: 14))
                        .foregroundStyle(AppPalette.muted)
                }
            }.rotationEffect(.degrees(-3)).padding(.trailing, 8)
            HStack {
                Spacer()
                PreviewBadge(title: "Лена придёт", symbol: "checkmark.circle.fill")
                    .padding(7).background(AppPalette.background, in: Capsule())
            }.padding(.trailing, 4)
        }
    }
}
