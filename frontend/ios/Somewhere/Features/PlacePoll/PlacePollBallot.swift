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
        let available = poll.canVote && poll.closesAt.date > Date()
        let selected = available && poll.myVote == value
        return HStack(spacing: DesignTokens.spaceS8) {
            if available {
                Text(value == "for" ? "За" : "Против")
                Spacer(minLength: DesignTokens.spaceS0)
                Text(String(value == "for" ? poll.votesFor : poll.votesAgainst)).monospacedDigit()
            } else {
                Text(
                    "\(value == "for" ? "За" : "Против") · \(value == "for" ? poll.votesFor : poll.votesAgainst)"
                )
                Spacer(minLength: DesignTokens.spaceS0)
            }
        }
        .designFont(DesignTokens.typographySizeButton)
        .opacity(busy ? 0 : 1)
        .padding(.horizontal, DesignTokens.spaceS12)
        .padding(.vertical, DesignTokens.spaceS12)
        .frame(maxWidth: .infinity, minHeight: DesignTokens.componentMobileSheetButtonHeight)
        .foregroundStyle(
            selected
                ? DesignTokens.colorOwnText
                : available ? DesignTokens.colorText : DesignTokens.colorMuted
        )
        .background(
            selected ? DesignTokens.colorOwnMessage : DesignTokens.colorRaised,
            in: RoundedRectangle(cornerRadius: DesignTokens.radiusControl)
        )
        .overlay {
            RoundedRectangle(cornerRadius: DesignTokens.radiusControl)
                .strokeBorder(
                    selected ? DesignTokens.colorAccent : DesignTokens.colorBorderStrong,
                    lineWidth: DesignTokens.spaceS1)
            if busy {
                ProgressView().tint(selected ? DesignTokens.colorOwnText : DesignTokens.colorAccent)
            }
        }
    }
}
