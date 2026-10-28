import SwiftUI

struct ParticipantAvatar: View {
    let user: UserProfile
    var size: CGFloat = 32
    var color: Color?
    private let colors: [Color] = [
        Color(red: 197 / 255, green: 177 / 255, blue: 161 / 255),
        Color(red: 187 / 255, green: 176 / 255, blue: 208 / 255),
        Color(red: 169 / 255, green: 190 / 255, blue: 181 / 255),
        Color(red: 199 / 255, green: 182 / 255, blue: 165 / 255),
        Color(red: 174 / 255, green: 184 / 255, blue: 203 / 255),
    ]
    var body: some View {
        initials.overlay {
            if let url = user.avatarURL, url.scheme == "https", url.user == nil, url.password == nil
            {
                AvatarPhoto(url: url)
                    .frame(width: size, height: size).clipShape(Circle())
            }
        }.accessibilityHidden(true)
    }
    private var initials: some View {
        Text(user.avatarURL == nil ? String(user.displayName.prefix(1)).uppercased() : "")
            .font(.system(size: size > 60 ? 30 : 11, weight: .semibold))
            .foregroundStyle(AppPalette.actionText).frame(width: size, height: size)
            .background(
                color
                    ?? (size > 60
                        ? Color(designHex: 0xc2af9f)
                        : colors[
                            user.id.uuidString.utf8.reduce(0) { ($0 + Int($1)) % colors.count }]),
                in: Circle()
            )
            .accessibilityHidden(true)
    }
}
