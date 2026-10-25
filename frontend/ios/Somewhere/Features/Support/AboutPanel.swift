import SwiftUI

struct AboutPanel: View {
    let support: () -> Void
    var body: some View {
        VStack(spacing: 16) {
            Image("RefreshBrand").resizable().frame(width: 76, height: 76)
            Text("somewhere").designFont(31, weight: .bold).tracking(-1.2)
            Text("Договориться о встрече, обсудить детали и сохранить её вайб.")
                .designFont(13).lineSpacing(7).foregroundStyle(AppPalette.muted)
                .multilineTextAlignment(.center)
            Rectangle().fill(AppPalette.border).frame(height: 1).padding(.vertical, 16)
            row("Приложение", value: "iOS")
            row("Версия", value: AppVersion.version)
            row("Сборка", value: AppVersion.build)
            row("Разработчик", value: "MintyDev")
            Rectangle().fill(AppPalette.border).frame(height: 1).padding(.vertical, 16)
            Button("Сообщить о проблеме", action: support).font(
                .system(size: 13, weight: .semibold)
            )
            .padding(.horizontal, 18).frame(minHeight: 47)
            .overlay {
                RoundedRectangle(cornerRadius: 13).stroke(.white.opacity(0.125), lineWidth: 1)
            }
            Text("Developed by MintyDev").designFont(11).foregroundStyle(AppPalette.muted)
        }.padding(.horizontal, 20).padding(.vertical, 25).frame(maxWidth: .infinity).background(
            AppPalette.surface, in: RoundedRectangle(cornerRadius: 22))
    }
    private func row(_ title: String, value: String) -> some View {
        HStack {
            Text(title).foregroundStyle(AppPalette.muted)
            Spacer()
            Text(value)
        }.designFont(13)
    }
}
