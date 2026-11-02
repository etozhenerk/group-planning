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
            VStack(spacing: 6) {
                Text(FeedPresentation.event(entry)).font(.footnote).multilineTextAlignment(.center)
                Text(FeedPresentation.time(entry.occurredAt.date)).font(.caption2)
            }.foregroundStyle(AppPalette.muted).padding(.vertical, 12)
                .frame(maxWidth: .infinity).accessibilityElement(children: .combine)
        }
    }
}
