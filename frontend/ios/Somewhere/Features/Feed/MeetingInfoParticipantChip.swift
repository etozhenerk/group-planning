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
                user: person.user, size: DesignTokens.componentMobilePeopleChipAvatarSize,
                textSize: DesignTokens.typographySizeMobilePeopleInitial,
                weight: DesignTokens.typographyWeightParticipantChipAvatar,
                color: DesignTokens.colorParticipantChipAvatar,
                textColor: DesignTokens.colorParticipantChipText)
            Text(person.user.displayName)
                .designFont(DesignTokens.typographySizeParticipantChip)
                .fixedSize(horizontal: false, vertical: true)
        }
        .foregroundStyle(DesignTokens.colorParticipantChipText)
        .padding(.leading, DesignTokens.componentMobilePeopleChipInsetStart)
        .padding(.trailing, DesignTokens.componentMobilePeopleChipInsetEnd)
        .padding(.vertical, DesignTokens.componentMobilePeopleChipInsetBlock)

        .background(
            colors[index % colors.count],
            in: Capsule()
        )
        .overlay {
            Capsule()
                .strokeBorder(DesignTokens.colorSurface, lineWidth: DesignTokens.spaceS2)
        }
    }
}
