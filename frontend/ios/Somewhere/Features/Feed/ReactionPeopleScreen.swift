import SwiftUI

struct ReactionPeopleScreen: View {
    let owner: FeedOwner
    let entryID: UUID
    @State private var filter: String?
    @AccessibilityFocusState private var focusedFilter: String?
    private var reactions: [MessageReaction] { owner.reactions.values[entryID] ?? [] }

    init(owner: FeedOwner, entryID: UUID) {
        self.owner = owner
        self.entryID = entryID
        _filter = State(initialValue: owner.reactionPeopleFilter)
    }

    var body: some View {
        ActionFormSheet(
            title: "Кто отреагировал", scrollIdentifier: "reaction-people",
            headerIdentifier: "reaction-people-header"
        ) {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: DesignTokens.spaceS6) {
                    filterButton(nil, title: "Все")
                    ForEach(reactions) { reaction in
                        filterButton(reaction.emoji, title: "\(reaction.emoji) \(reaction.count)")
                    }
                }
            }
            ForEach(
                Array(ReactionPeople.rows(reactions, filter: filter).enumerated()), id: \.element.id
            ) { index, person in
                HStack(spacing: DesignTokens.componentMobileRosterRowGap) {
                    MeetingInfoAvatar(
                        user: person.user, size: DesignTokens.componentMobileRosterAvatarSize,
                        textSize: DesignTokens.typographySizeCaption,
                        weight: DesignTokens.typographyWeightSemibold,
                        color: index.isMultiple(of: 2)
                            ? DesignTokens.colorRosterMint : DesignTokens.colorRosterLilac,
                        textColor: DesignTokens.colorRosterText)
                    Text(person.user.displayName).designFont(DesignTokens.typographySizeSmall)
                    Spacer(minLength: DesignTokens.spaceS0)
                    Text(person.emoji.joined(separator: " ")).designFont(
                        DesignTokens.typographySizeCardTitle)
                }.frame(minHeight: DesignTokens.componentMobileRosterRowHeight)
                    .accessibilityElement(children: .combine)
            }
        }.onChange(of: reactions) { _, values in
            if let filter, !values.contains(where: { $0.emoji == filter }) { self.filter = nil }
        }
    }

    private func filterButton(_ value: String?, title: String) -> some View {
        Button {
            filter = value
            focusedFilter = value ?? "all"
        } label: {
            Text(title).designFont(DesignTokens.typographySizeSmall)
                .padding(.horizontal, DesignTokens.componentReactionPeopleFilterInsetInline)
                .padding(.vertical, DesignTokens.componentReactionPeopleFilterInsetBlock)
                .frame(minWidth: DesignTokens.targetIos, minHeight: DesignTokens.targetIos)
                .background(
                    DesignTokens.colorBackground,
                    in: RoundedRectangle(
                        cornerRadius: DesignTokens.componentReactionPeopleFilterRadius)
                )
                .overlay {
                    RoundedRectangle(cornerRadius: DesignTokens.componentReactionPeopleFilterRadius)
                        .strokeBorder(
                            filter == value ? DesignTokens.colorAccent : .clear,
                            lineWidth: DesignTokens.spaceS1)
                }
        }.buttonStyle(.plain).accessibilityAddTraits(filter == value ? .isSelected : [])
            .accessibilityFocused($focusedFilter, equals: value ?? "all")
            .accessibilityIdentifier("reaction-filter-" + (value ?? "all"))
    }
}
