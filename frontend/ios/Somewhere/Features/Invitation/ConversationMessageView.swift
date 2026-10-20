import SwiftUI

struct ConversationMessageView: View {
    let entry: FeedEntry
    let own: Bool
    var body: some View {
        HStack {
            if own { Spacer(minLength: 40) }
            VStack(alignment: .leading, spacing: 6) {
                if !own {
                    Text(entry.actor.displayName).font(.caption.weight(.semibold)).foregroundStyle(
                        AppPalette.accent)
                }
                Text(entry.messageText ?? "").font(.body).textSelection(.enabled)
                    .foregroundStyle(own ? AppPalette.actionText : AppPalette.text)
            }.padding(16).background(
                own ? AppPalette.ownMessage : AppPalette.message,
                in: RoundedRectangle(cornerRadius: 20))
            if !own { Spacer(minLength: 40) }
        }
    }
}
