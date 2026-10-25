import SwiftUI

struct FeedMessageView: View {
    let user: UserProfile
    let text: String
    let date: Date
    let own: Bool
    @ScaledMetric(relativeTo: .body) private var bodySize = 14.0
    @ScaledMetric(relativeTo: .caption) private var authorSize = 11.0
    @ScaledMetric(relativeTo: .caption2) private var timeSize = 11.0
    @State private var availableWidth: CGFloat = 0
    private var textWidth: CGFloat? {
        guard availableWidth > 0 else { return nil }
        let natural = (text as NSString).size(withAttributes: [
            .font: UIFont.systemFont(ofSize: bodySize)
        ]).width
        return min(ceil(natural), max(0, availableWidth * 0.94 - 58))
    }
    var body: some View {
        HStack(alignment: .bottom, spacing: 7) {
            if own {
                Spacer(minLength: 0)
            } else {
                ParticipantAvatar(
                    user: user, size: 25, color: Color(designHex: own ? 0xd8c6ad : 0xc2b1d5))
            }
            VStack(alignment: own ? .trailing : .leading, spacing: 5) {
                HStack(alignment: .firstTextBaseline, spacing: 9) {
                    Text(user.displayName).font(
                        .system(size: authorSize, weight: .semibold)
                    )
                    .foregroundStyle(AppPalette.muted)
                    Text(FeedPresentation.time(date)).font(.system(size: timeSize)).foregroundStyle(
                        AppPalette.muted)
                }.frame(minHeight: 16.5).padding(.horizontal, 0)
                Text(text).font(.system(size: bodySize)).lineSpacing(5.4)
                    .frame(width: textWidth, alignment: .leading).fixedSize(
                        horizontal: false, vertical: true
                    )
                    .padding(.vertical, 2.7)
                    .foregroundStyle(own ? AppPalette.actionText : AppPalette.text)
                    .padding(.horizontal, 13).padding(.vertical, 10)
                    .background(
                        own ? AppPalette.ownMessage : AppPalette.surface,
                        in: UnevenRoundedRectangle(
                            topLeadingRadius: 18,
                            bottomLeadingRadius: own ? 18 : 5, bottomTrailingRadius: own ? 5 : 18,
                            topTrailingRadius: 18))
            }.layoutPriority(1)
            if own {
                ParticipantAvatar(
                    user: user, size: 25, color: Color(designHex: own ? 0xd8c6ad : 0xc2b1d5))
            } else {
                Spacer(minLength: 0)
            }
        }
        .frame(maxWidth: .infinity)
        .onGeometryChange(for: CGFloat.self) {
            $0.size.width
        } action: {
            availableWidth = $0
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(
            "\(user.displayName), \(FeedPresentation.time(date)). \(text)")
    }
}
