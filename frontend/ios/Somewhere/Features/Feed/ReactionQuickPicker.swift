import SwiftUI

struct ReactionQuickPicker: View {
    let reactions: [MessageReaction]
    let choose: (String) -> Void
    let all: () -> Void
    let people: (MessageReaction) -> Void
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 1) {
                ForEach(["❤️", "👍", "😂", "🔥", "🎉"], id: \.self) { emoji in
                    Button {
                        choose(emoji)
                    } label: {
                        Text(emoji).font(.system(size: 24)).frame(width: 34, height: 38)
                            .contentShape(Rectangle().inset(by: -5))
                    }
                    .buttonStyle(.plain).accessibilityLabel(emoji)
                }
                Button(action: all) {
                    ExperienceIcon(kind: .plus).frame(width: 34, height: 38)
                        .contentShape(Rectangle().inset(by: -5))
                }
                .accessibilityLabel("Другой эмодзи")
            }.padding(7).background(Color(designHex: 0x393a42), in: Capsule())
                .shadow(color: .black.opacity(0.2), radius: 10, y: 8)
            ForEach(reactions) { reaction in
                Button("Кто поставил \(reaction.emoji)") { people(reaction) }.font(
                    .system(size: 12)
                )
                .padding(.horizontal, 12).frame(minHeight: 36).background(
                    AppPalette.surface, in: Capsule())
            }
        }
    }
}
