import SwiftUI

struct MeetingInfoParticipantChip: View {
    let person: Participant
    let index: Int
    private let colors = [
        DesignTokens.colorParticipantChipFirst, DesignTokens.colorParticipantChipSecond,
        DesignTokens.colorParticipantChipThird,
    ]

    var body: some View {
        HStack(spacing: DesignTokens.componentMobilePeopleChipGap) {
            MeetingInfoAvatar(
                user: person.user, size: DesignTokens.componentParticipantChipAvatarSize,
                color: DesignTokens.colorParticipantChipAvatar,
                foregroundColor: DesignTokens.colorParticipantChipText)
            Text(person.user.displayName)
                .designFont(DesignTokens.typographySizeParticipantChip)
                .fixedSize(horizontal: false, vertical: true)
        }
        .foregroundStyle(DesignTokens.colorParticipantChipText)
        .padding(.leading, DesignTokens.componentMobileInfoCompanyChipInsetStart)
        .padding(.trailing, DesignTokens.componentMobileInfoCompanyChipInsetEnd)
        .padding(.vertical, DesignTokens.componentMobileInfoCompanyChipInsetBlock)

        .frame(minHeight: DesignTokens.componentMobileInfoCompanyChipHeight)
        .background(
            colors[index % colors.count],
            in: RoundedRectangle(cornerRadius: DesignTokens.componentMobileInfoCompanyChipRadius)
        )
    }
}
