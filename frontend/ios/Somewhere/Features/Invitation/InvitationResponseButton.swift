import SwiftUI

struct InvitationResponseButton: View {
    let owner: InvitationOwner
    let answer: RSVPAnswer
    var compact = false

    private var enabled: Bool {
        !owner.loading && !owner.saving
            && (owner.pending.map { $0.input.answer == answer } ?? owner.editable)
    }

    var body: some View {
        Button {
            owner.respond(answer)
        } label: {
            if compact {
                Text(RSVPLabels.title(answer))
                    .modifier(MeetingInfoButtonLabel(selected: owner.answer == answer))
            } else {
                Text(RSVPLabels.title(answer))
                    .designFont(
                        answer == .going
                            ? DesignTokens.typographySizeButton : DesignTokens.typographySizeSmall,
                        weight: answer == .going ? .semibold : .medium
                    )
                    .foregroundStyle(
                        answer == .going ? DesignTokens.colorActionText : DesignTokens.colorText
                    )
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity)
                    .padding(.horizontal, DesignTokens.spaceS12)
                    .padding(.vertical, DesignTokens.spaceS10)
                    .frame(
                        minHeight: answer == .going
                            ? DesignTokens.targetAndroid : DesignTokens.targetIos
                    )
                    .background(
                        answer == .going ? DesignTokens.colorAction : .clear,
                        in: RoundedRectangle(cornerRadius: DesignTokens.componentButtonRadius)
                    )
                    .overlay {
                        RoundedRectangle(cornerRadius: DesignTokens.componentButtonRadius)
                            .strokeBorder(
                                answer == .going ? .clear : DesignTokens.colorBorderStrong,
                                lineWidth: DesignTokens.spaceS1)
                    }
            }
        }
        .buttonStyle(OnboardingPressStyle()).disabled(!enabled)
        .opacity(enabled ? 1 : DesignTokens.componentButtonDisabledOpacity)
        .accessibilityIdentifier("rsvp-" + answer.rawValue)
        .accessibilityAddTraits(owner.answer == answer ? .isSelected : [])
    }
}
