import SwiftUI

struct MeetingHomeHeader: View {
    let user: UserProfile
    let logout: () -> Void
    var deleteAccount: () -> Void = {}

    var body: some View {
        HStack(spacing: 16) {
            BrandWordmark(compact: true)
                .dynamicTypeSize(...DynamicTypeSize.xxxLarge)
                .fixedSize(horizontal: true, vertical: false)
            Spacer(minLength: 0)
            Menu {
                Text(user.displayName)
                Button("Выйти из аккаунта", action: logout)
                Button("Удалить аккаунт", role: .destructive, action: deleteAccount)
            } label: {
                Image(systemName: "person.crop.circle").font(.system(size: 24))
                    .foregroundStyle(AppPalette.muted).frame(width: 44, height: 44)
                    .contentShape(Rectangle())
            }.accessibilityLabel("Профиль: " + user.displayName)
        }
        .buttonStyle(.plain).padding(.horizontal, 24).padding(.vertical, 8)
        .background(AppPalette.background)
    }
}
