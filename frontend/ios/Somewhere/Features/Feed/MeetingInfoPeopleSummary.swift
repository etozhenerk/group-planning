import SwiftUI

struct MeetingInfoPeopleSummary: View {
    let people: [Participant]

    var body: some View {
        ViewThatFits(in: .horizontal) {
            HStack(
                spacing: DesignTokens.componentMobileInfoCompanyChipGap
                    - DesignTokens.componentMobileInfoCompanyChipOverlap
            ) { chips }
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
                .padding(.horizontal, DesignTokens.componentMobileInfoCompanyChipInsetEnd)
                .padding(.vertical, DesignTokens.componentMobileInfoCompanyChipInsetBlock)
                .frame(
                    minWidth: DesignTokens.componentMobileInfoCompanyMoreMinimumWidth,
                    minHeight: DesignTokens.componentMobileInfoCompanyChipHeight
                )
                .background(
                    DesignTokens.colorBackground,
                    in: RoundedRectangle(
                        cornerRadius: DesignTokens.componentMobileInfoCompanyChipRadius)
                )
                .overlay {
                    RoundedRectangle(
                        cornerRadius: DesignTokens.componentMobileInfoCompanyChipRadius
                    )
                    .strokeBorder(DesignTokens.colorBorderStrong, lineWidth: DesignTokens.spaceS1)
                }
        }
    }
}
