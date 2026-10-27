import SwiftUI

struct MeetingInfoPersonRow: View {
    let person: Participant
    let index: Int
    private let colors = [
        DesignTokens.colorRosterSand, DesignTokens.colorRosterLilac, DesignTokens.colorRosterMint,
        DesignTokens.colorRosterSand, DesignTokens.colorRosterBlue, DesignTokens.colorRosterLilac,
    ]

    var body: some View {
        HStack(spacing: DesignTokens.componentMobileRosterRowGap) {
            MeetingInfoAvatar(
                user: person.user, size: DesignTokens.componentMobileRosterAvatarSize,
                textSize: DesignTokens.typographySizeParticipantRosterAvatar,
                weight: DesignTokens.typographyWeightParticipantRosterAvatar,
                color: colors[index % colors.count], textColor: DesignTokens.colorRosterText)
            VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
                Text(person.user.displayName)
                    .designFont(DesignTokens.typographySizeSmall)
                    .foregroundStyle(DesignTokens.colorText)
                Text(
                    person.role == "organizer"
                        ? "Организатор" : person.rsvp.map(RSVPLabels.title) ?? "Без ответа"
                )
                .designFont(DesignTokens.typographySizeLabel)
                .foregroundStyle(DesignTokens.colorMuted)
            }.fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: DesignTokens.spaceS0)
        }.frame(minHeight: DesignTokens.componentMobileRosterRowHeight).accessibilityElement(
            children: .combine
        )
        .accessibilityIdentifier("participant-" + person.user.id.uuidString.lowercased())
    }
}
