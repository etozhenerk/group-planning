import SwiftUI

struct PlacePollBallot: View {
    let owner: PlacePollOwner
    let poll: PlacePoll
    @Environment(\.dynamicTypeSize) private var typeSize
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            if typeSize.isAccessibilitySize {
                VStack {
                    answer("for")
                    answer("against")
                }
            } else {
                HStack {
                    answer("for")
                    answer("against")
                }
            }
            if let own = poll.myVote, ["for", "against"].contains(own) {
                Text("Ваш голос: \(own == "for" ? "За" : "Против")").font(.caption)
            }
        }
    }

    @ViewBuilder private func answer(_ value: String) -> some View {
        let title =
            "\(value == "for" ? "За" : "Против") · \(value == "for" ? poll.votesFor : poll.votesAgainst)"
        if poll.canVote && poll.closesAt.date > Date() {
            Button {
                Task { await owner.vote(value) }
            } label: {
                Text(title).font(.body.weight(poll.myVote == value ? .bold : .regular))
                    .opacity(owner.busy && owner.sendingAnswer == value ? 0 : 1)
                    .frame(maxWidth: .infinity, minHeight: 44).padding(.horizontal, 12)
                    .background(
                        .primary.opacity(poll.myVote == value ? 0.18 : 0.06),
                        in: RoundedRectangle(cornerRadius: 12)
                    )
                    .overlay { if owner.busy && owner.sendingAnswer == value { ProgressView() } }
            }.buttonStyle(.plain).disabled(!owner.editable)
                .accessibilityLabel(title).accessibilityAddTraits(
                    poll.myVote == value ? .isSelected : []
                )
                .accessibilityIdentifier("place-vote-\(value)")
        } else {
            Text(title).frame(maxWidth: .infinity, minHeight: 44)
        }
    }
}
