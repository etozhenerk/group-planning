import SwiftUI

struct MeetingInfoPeople: View {
    let id: UUID
    let session: SessionStore
    @Binding var expanded: Bool
    @AccessibilityFocusState private var collapseFocused: Bool
    @State private var restoreSummaryFocus = false
    @AccessibilityFocusState private var summaryFocused: Bool
    @State private var reloadID: UUID?

    var body: some View {
        VStack(
            alignment: .leading,
            spacing: expanded
                ? DesignTokens.spaceS0
                : DesignTokens.spaceS8
        ) {
            let people = session.privateData.participants[id]?.value?.participants ?? []
            let going = people.filter { $0.role == "organizer" || $0.rsvp == .going }
            HStack(spacing: DesignTokens.spaceS6) {
                Text(expanded ? "Все ответы" : "Кто придёт")
                    .accessibilityAddTraits(.isHeader).accessibilityIdentifier(
                        "participant-count")
                Spacer(minLength: DesignTokens.spaceS8)
                Text(
                    String(
                        session.privateData.participants[id]?.value != nil
                            ? (expanded ? people.count : going.count)
                            : (session.privateData.details[id]?.value?.participantCount ?? 0))
                )
                .designFont(DesignTokens.typographySizeSmall, weight: .regular)
                .foregroundStyle(
                    DesignTokens.colorMuted)
            }.designFont(DesignTokens.typographySizeSectionHeading, weight: .semibold)
            if session.privateData.participants[id]?.isLoading == true {
                PeopleLoadingView()
            } else if session.privateData.participants[id]?.error != nil {
                PeopleLoadFailure { reloadID = UUID() }
            } else if session.privateData.participants[id]?.value != nil {
                Button {
                    expanded.toggle()
                    if !expanded { restoreSummaryFocus = true }
                } label: {
                    MeetingInfoPeopleSummary(people: going)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .frame(minHeight: DesignTokens.componentMobilePeopleChipOpenerHeight)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Компания, " + ExperienceDate.participants(going.count))
                .accessibilityHint(
                    expanded ? "Свернуть все ответы" : "Показать всех участников и их ответы"
                )
                .accessibilityIdentifier("meeting-people-summary")
                .accessibilityFocused($summaryFocused)
                .onChange(of: expanded) { _, expanded in
                    if !expanded, restoreSummaryFocus {
                        summaryFocused = true
                        restoreSummaryFocus = false
                    }
                }
                if !expanded {
                    Button("Все ответы · \(people.count) →") { expanded = true }
                        .designFont(DesignTokens.typographySizeCaption)
                        .foregroundStyle(DesignTokens.colorAccent)
                        .frame(minHeight: DesignTokens.targetIos)
                        .accessibilityIdentifier("meeting-people-all")
                }
                if expanded {
                    ForEach(Array(people.enumerated()), id: \.element.user.id) { index, person in
                        MeetingInfoPersonRow(person: person, index: index)
                    }
                    Button("Свернуть список") {
                        expanded = false
                        restoreSummaryFocus = true
                    }
                    .designFont(DesignTokens.typographySizeSmall)
                    .foregroundStyle(DesignTokens.colorAccent)
                    .frame(minHeight: DesignTokens.targetIos)
                    .buttonStyle(.plain).accessibilityIdentifier("meeting-people-collapse")
                    .accessibilityFocused($collapseFocused).onAppear { collapseFocused = true }
                }
            } else {
                PeopleLoadingView()
            }
        }.frame(maxWidth: .infinity, alignment: .leading)
            .task(id: reloadID) {
                if reloadID != nil {
                    await MeetingRepository(session: session).loadParticipants(id)
                }
            }
    }
}
