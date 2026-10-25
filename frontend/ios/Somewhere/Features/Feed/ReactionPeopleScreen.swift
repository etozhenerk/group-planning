import SwiftUI

struct ReactionPeopleScreen: View {
    let reaction: MessageReaction
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Text("\(reaction.emoji)  \(reaction.count)").font(.system(size: 20, weight: .bold))
                Spacer()
                Button {
                    dismiss()
                } label: {
                    ExperienceIcon(kind: .close).frame(width: 44, height: 44).contentShape(
                        Rectangle())
                }.accessibilityLabel("Готово")
            }.padding(.horizontal, 20).padding(.top, 12)
            ScrollView {
                VStack(spacing: 0) {
                    ForEach(reaction.users, id: \.id) { user in
                        HStack(spacing: 14) {
                            ParticipantAvatar(user: user)
                            Text(user.displayName).font(.system(size: 14))
                            Spacer()
                        }.padding(.vertical, 12)
                    }
                }.padding(.horizontal, 20)
            }
        }.background(AppPalette.surface).presentationDetents([.medium, .large])
    }
}
