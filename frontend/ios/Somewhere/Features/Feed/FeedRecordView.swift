import SwiftUI
import UIKit

struct FeedRecordView: View {
    let entry: FeedEntry
    let own: Bool
    let availableWidth: CGFloat
    @ScaledMetric(relativeTo: .caption2) private var timeSize = DesignTokens
        .componentRsvpSystemTimeSize
    @ScaledMetric(relativeTo: .caption2) private var timeLine = DesignTokens
        .componentRsvpSystemTimeLineHeight
    @ScaledMetric(relativeTo: .footnote) private var textSize = DesignTokens
        .componentRsvpSystemTextSize
    @ScaledMetric(relativeTo: .footnote) private var textLine = DesignTokens
        .componentRsvpSystemTextLineHeight

    private var timeSpacing: CGFloat {
        max(0, timeLine - UIFont.systemFont(ofSize: timeSize).lineHeight)
    }
    private var textSpacing: CGFloat {
        max(0, textLine - UIFont.systemFont(ofSize: textSize).lineHeight)
    }
    var body: some View {
        if let text = entry.messageText {
            FeedMessageView(
                user: entry.actor, text: text, date: entry.occurredAt.date, own: own,
                maximumWidth: availableWidth)
        } else {
            VStack(spacing: DesignTokens.componentRsvpSystemGap) {
                Text(FeedPresentation.time(entry.occurredAt.date))
                    .font(.system(size: timeSize)).monospacedDigit()
                    .lineSpacing(timeSpacing).padding(.vertical, timeSpacing / 2)
                    .opacity(DesignTokens.componentRsvpSystemTimeOpacity)
                Text(FeedPresentation.event(entry))
                    .font(.system(size: textSize))
                    .lineSpacing(textSpacing).padding(.vertical, textSpacing / 2)
                    .multilineTextAlignment(.center)
            }.foregroundStyle(DesignTokens.colorMuted).padding(.vertical, DesignTokens.spaceS4)
                .frame(maxWidth: .infinity).accessibilityElement(children: .combine)
        }
    }
}
