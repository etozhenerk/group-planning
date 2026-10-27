import SwiftUI

struct MeetingInfoPeopleSummary: View {
    let people: [Participant]

    var body: some View {
        ViewThatFits(in: .horizontal) {
            HStack(spacing: -DesignTokens.componentMobilePeopleChipOverlap) { chips }
                .fixedSize(horizontal: true, vertical: true)
            VStack(alignment: .leading, spacing: DesignTokens.componentMobilePeopleChipGap) {
                chips
            }
        }
    }

    @ViewBuilder private var chips: some View {
        ForEach(Array(people.prefix(3).enumerated()), id: \.element.user.id) { index, person in
            MeetingInfoParticipantChip(person: person, index: index)
        }
        if people.count > 3 || people.isEmpty {
            Text(people.isEmpty ? ExperienceDate.participants(0) : "+\(people.count - 3)")
                .designFont(DesignTokens.typographySizeLabel)
                .foregroundStyle(DesignTokens.colorText)
                .padding(.horizontal, DesignTokens.componentMobilePeopleChipMoreInsetInline)
                .padding(.vertical, DesignTokens.componentMobilePeopleChipMoreInsetBlock)
                .frame(minWidth: DesignTokens.componentMobilePeopleChipMoreWidth)
                .background(
                    DesignTokens.colorParticipantChipMore,
                    in: Capsule()
                )
                .overlay {
                    Capsule()
                        .strokeBorder(
                            DesignTokens.colorSurface, lineWidth: DesignTokens.spaceS2)
                }
        }
    }
}
