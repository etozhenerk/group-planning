import SwiftUI

struct FeedMessageView: View {
    let user: UserProfile
    let text: String
    let date: Date
    let own: Bool
    @ScaledMetric(relativeTo: .body) private var bodySize = 15.0
    @ScaledMetric(relativeTo: .caption) private var authorSize = 13.0
    @ScaledMetric(relativeTo: .caption2) private var timeSize = 11.0
    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            if own { Spacer(minLength: 24) } else { ParticipantAvatar(user: user) }
            VStack(alignment: own ? .trailing : .leading, spacing: 6) {
                HStack(alignment: .firstTextBaseline, spacing: 9) {
                    Text(own ? "Вы" : user.displayName).font(
                        .system(size: authorSize, weight: .semibold)
                    )
                    .foregroundStyle(AppPalette.text)
                    Text(FeedPresentation.time(date)).font(.system(size: timeSize)).foregroundStyle(
                        AppPalette.muted)
                }.padding(.horizontal, 4)
                Text(text).font(.system(size: bodySize)).lineSpacing(4).textSelection(.enabled)
                    .fixedSize(horizontal: false, vertical: true)
                    .foregroundStyle(own ? AppPalette.actionText : AppPalette.text)
                    .padding(.horizontal, 13).padding(.vertical, 10)
                    .background(
                        own ? AppPalette.ownMessage : AppPalette.message,
                        in: UnevenRoundedRectangle(
                            topLeadingRadius: own ? 20 : 6,
                            bottomLeadingRadius: 20, bottomTrailingRadius: 20,
                            topTrailingRadius: own ? 6 : 20))
            }
            if own { ParticipantAvatar(user: user) } else { Spacer(minLength: 24) }
        }
    }
}
