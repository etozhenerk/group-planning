import SwiftUI

struct ProfileIdentityPanel: View {
    let profile: AccountProfile
    @Environment(\.dynamicTypeSize) private var typeSize
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 14) {
                ParticipantAvatar(
                    user: UserProfile(
                        id: profile.id, displayName: profile.displayName,
                        avatarURL: profile.avatarURL), size: 86)
                VStack(alignment: .leading, spacing: 0) {
                    Text(profile.displayName).designFont(22, weight: .bold).tracking(-0.5)
                        .frame(minHeight: 27.5)
                    Text("Имя и фото видны участникам встреч").designFont(12).lineSpacing(
                        3.5
                    )
                    .foregroundStyle(AppPalette.muted).fixedSize(horizontal: false, vertical: true)
                }.frame(maxWidth: .infinity, alignment: .leading)
            }
            Rectangle().fill(AppPalette.border).frame(height: 1).padding(.vertical, 38)
            ViewThatFits(in: .horizontal) {
                HStack(spacing: 14) {
                    provider
                    Spacer(minLength: 0)
                    status
                }
                VStack(alignment: .leading, spacing: 12) {
                    provider
                    status
                }
            }
        }.padding(20).background(AppPalette.surface, in: RoundedRectangle(cornerRadius: 22))
    }
    private var provider: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Яндекс ID").designFont(16, weight: .bold).frame(minHeight: 24)
            Text("Аккаунт для входа в somewhere").designFont(12).foregroundStyle(
                AppPalette.muted
            ).frame(minHeight: 18)
        }
    }
    private var status: some View {
        Text("Подключён").designFont(11).foregroundStyle(AppPalette.muted)
            .padding(.horizontal, 9).padding(.vertical, 4)
            .background(.white.opacity(0.043), in: RoundedRectangle(cornerRadius: 6))
    }
}
