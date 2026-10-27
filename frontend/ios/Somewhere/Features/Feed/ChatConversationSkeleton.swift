import SwiftUI

struct ChatConversationSkeleton: View {
    var count = 3
    private let person = UserProfile(id: UUID(), displayName: "Участник")
    var body: some View {
        VStack(spacing: DesignTokens.spaceS20) {
            ForEach(0..<count, id: \.self) { index in
                FeedMessageView(
                    user: person, text: "Сообщение в разговоре", date: .distantPast,
                    own: index.isMultiple(of: 2))
            }
        }.redacted(reason: .placeholder).allowsHitTesting(false)
            .accessibilityElement(children: .ignore).accessibilityLabel("Загружаем сообщения")
    }
}
