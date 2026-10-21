import SwiftUI

struct ParticipantAvatar: View {
    let user: UserProfile
    var size: CGFloat = 32
    private let colors: [Color] = [
        Color(red: 197 / 255, green: 177 / 255, blue: 161 / 255),
        Color(red: 187 / 255, green: 176 / 255, blue: 208 / 255),
        Color(red: 169 / 255, green: 190 / 255, blue: 181 / 255),
        Color(red: 199 / 255, green: 182 / 255, blue: 165 / 255),
        Color(red: 174 / 255, green: 184 / 255, blue: 203 / 255),
    ]
    var body: some View {
        Text(String(user.displayName.prefix(1)).uppercased())
            .font(.system(size: size * 0.44, weight: .semibold))
            .foregroundStyle(AppPalette.actionText).frame(width: size, height: size)
            .background(
                colors[user.id.uuidString.utf8.reduce(0) { ($0 + Int($1)) % colors.count }],
                in: Circle()
            )
            .accessibilityHidden(true)
    }
}
