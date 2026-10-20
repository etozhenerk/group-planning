import SwiftUI

struct EmptyMeetingsView: View {
    let create: () -> Void
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "sparkles").font(.largeTitle).foregroundStyle(AppPalette.accent)
                .padding(20).background(AppPalette.surface, in: RoundedRectangle(cornerRadius: 24))
                .accessibilityHidden(true)
            Text("С чего начнём?").font(.title2.bold())
            Text("Создайте встречу и пригласите друзей по ссылке.").foregroundStyle(
                AppPalette.muted
            ).multilineTextAlignment(.center)
            ActionButton(title: "Создать встречу", action: create)
        }
        .frame(maxWidth: .infinity).padding(.vertical, 44).accessibilityIdentifier("meetings-empty")
    }
}
