import SwiftUI

struct FeedRecordView: View {
    let entry: FeedEntry
    let own: Bool
    let availableWidth: CGFloat
    var body: some View {
        if let text = entry.messageText {
            FeedMessageView(
                user: entry.actor, text: text, date: entry.occurredAt.date, own: own,
                maximumWidth: availableWidth)
        } else {
            VStack(spacing: DesignTokens.componentRsvpSystemGap) {
                Text(FeedPresentation.time(entry.occurredAt.date))
                    .designTokenFont(
                        DesignTokens.componentRsvpSystemTimeSize,
                        weight: DesignTokens.typographyWeightRegular, relativeTo: .caption2
                    ).opacity(DesignTokens.componentRsvpSystemTimeOpacity)
                Text(FeedPresentation.event(entry))
                    .designTokenFont(
                        DesignTokens.componentRsvpSystemTextSize,
                        weight: DesignTokens.typographyWeightRegular, relativeTo: .footnote
                    ).multilineTextAlignment(.center)
            }.foregroundStyle(DesignTokens.colorMuted).padding(.vertical, DesignTokens.spaceS12)
                .frame(maxWidth: .infinity).accessibilityElement(children: .combine)
        }
    }
}
