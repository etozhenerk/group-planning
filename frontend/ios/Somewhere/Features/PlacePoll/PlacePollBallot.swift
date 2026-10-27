import SwiftUI

struct PlacePollBallot: View {
    let owner: PlacePollOwner
    let poll: PlacePoll
    @Environment(\.dynamicTypeSize) private var typeSize
    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
            if typeSize.isAccessibilitySize {
                VStack(spacing: DesignTokens.spaceS8) {
                    answer("for")
                    answer("against")
                }
            } else {
                HStack(spacing: DesignTokens.spaceS8) {
                    answer("for")
                    answer("against")
                }
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
                answerLabel(value)
            }.buttonStyle(ChatPressStyle()).disabled(!owner.editable)
                .accessibilityLabel(title).accessibilityAddTraits(
                    poll.myVote == value ? .isSelected : []
                )
                .accessibilityIdentifier("place-vote-\(value)")
        } else {
            answerLabel(value).accessibilityElement(children: .ignore)
                .accessibilityLabel(title)
        }
    }

    private func answerLabel(_ value: String) -> some View {
        let busy = owner.busy && owner.sendingAnswer == value
        return HStack(spacing: DesignTokens.spaceS8) {
            Text(value == "for" ? "За" : "Против")
            Spacer(minLength: DesignTokens.spaceS0)
            Text(String(value == "for" ? poll.votesFor : poll.votesAgainst))
                .foregroundStyle(DesignTokens.colorMuted).monospacedDigit()
        }
        .designFont(DesignTokens.typographySizeSmall)
        .opacity(busy ? 0 : 1)
        .padding(.horizontal, DesignTokens.componentMobileChatInlineVoteInsetInline)
        .padding(.vertical, DesignTokens.componentMobileChatInlineVoteInsetBlock)
        .frame(maxWidth: .infinity, minHeight: DesignTokens.targetIos)
        .background(
            DesignTokens.colorRaised,
            in: RoundedRectangle(cornerRadius: DesignTokens.componentMobileChatInlineVoteRadius)
        )
        .overlay {
            RoundedRectangle(cornerRadius: DesignTokens.componentMobileChatInlineVoteRadius)
                .strokeBorder(
                    poll.myVote == value ? DesignTokens.colorAccent : DesignTokens.colorLine,
                    lineWidth: DesignTokens.spaceS1)
            if busy { ProgressView() }
        }
    }
}
