import SwiftUI

struct RSVPChoiceView: View {
    let answer: RSVPAnswer
    let selected: Bool
    let disabled: Bool
    let action: () -> Void
    var compact = false
    var body: some View {
        Button(action: action) {
            if compact {
                Text(RSVPLabels.title(answer)).fixedSize(horizontal: false, vertical: true)
                    .modifier(MeetingInfoButtonLabel(selected: selected))
            } else {
                HStack(spacing: 14) {
                    Image(systemName: selected ? "checkmark.circle.fill" : "circle")
                        .font(.title3).foregroundStyle(
                            selected ? AppPalette.accent : AppPalette.muted
                        )
                        .accessibilityHidden(true)
                    Text(RSVPLabels.title(answer)).font(.body.weight(.medium))
                    Spacer(minLength: 8)
                }.foregroundStyle(AppPalette.text).padding(16)
                    .background(AppPalette.background, in: RoundedRectangle(cornerRadius: 16))
            }
        }
        .buttonStyle(OnboardingPressStyle()).disabled(disabled)
        .accessibilityIdentifier("rsvp-" + answer.rawValue)
        .accessibilityAddTraits(selected ? .isSelected : [])
    }
}
