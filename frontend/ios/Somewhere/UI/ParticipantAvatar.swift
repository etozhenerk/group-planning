import SwiftUI

struct ParticipantAvatar: View {
    let user: UserProfile
    var size: CGFloat = 32
    var color: Color?
    var foregroundColor: Color = AppPalette.actionText
    var cornerRadius: CGFloat? = nil
    private let colors: [Color] = [
        Color(red: 197 / 255, green: 177 / 255, blue: 161 / 255),
        Color(red: 187 / 255, green: 176 / 255, blue: 208 / 255),
        Color(red: 169 / 255, green: 190 / 255, blue: 181 / 255),
        Color(red: 199 / 255, green: 182 / 255, blue: 165 / 255),
        Color(red: 174 / 255, green: 184 / 255, blue: 203 / 255),
    ]
    var body: some View {
        fallback.overlay {
            if let url = user.avatarURL, url.scheme == "https", url.user == nil, url.password == nil
            {
                AvatarPhoto(url: url)
                    .frame(width: size, height: size).clipShape(
                        RoundedRectangle(cornerRadius: cornerRadius ?? size / 2))
            }
        }.accessibilityHidden(true)
    }
    private var fallback: some View {
        AvatarSilhouette()
            .fill(foregroundColor.opacity(DesignTokens.componentMobileAvatarFallbackOpacity))
            .frame(
                width: size * CGFloat(DesignTokens.componentMobileAvatarFallbackRatio),
                height: size * CGFloat(DesignTokens.componentMobileAvatarFallbackRatio)
            )
            .frame(width: size, height: size)
            .background(
                color
                    ?? (size > 60
                        ? Color(designHex: 0xc2af9f)
                        : colors[
                            user.id.uuidString.utf8.reduce(0) { ($0 + Int($1)) % colors.count }]),
                in: RoundedRectangle(cornerRadius: cornerRadius ?? size / 2)
            )
            .accessibilityHidden(true)
    }
}
