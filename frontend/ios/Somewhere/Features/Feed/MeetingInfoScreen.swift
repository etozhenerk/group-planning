import SwiftUI

struct MeetingInfoScreen: View {
    let owner: FeedOwner
    @State private var reloadID = UUID()
    private var details: ResourceState<Meeting>? { owner.session.privateData.details[owner.id] }
    private var ready: Bool {
        owner.current && details?.isLoading != true && details?.error == nil && owner.meeting != nil
    }

    var body: some View {
        ActionFormSheet(
            title: "О встрече", scrollIdentifier: "meeting-info",
            headerIdentifier: "meeting-info-header",
            scrollOffset: Binding(
                get: { owner.informationScrollOffset }, set: { owner.informationScrollOffset = $0 }),
            stickyFooter: true, footerVisible: ready
        ) {
            if owner.current {
                if details?.isLoading == true {
                    DetailsLoadingView(label: "Загрузка встречи")
                } else if details?.error != nil {
                    MeetingInfoFailure { reloadID = UUID() }
                } else if owner.meeting == nil {
                    DetailsLoadingView(label: "Загрузка встречи")
                }
            }
            if ready, let meeting = owner.meeting {
                if owner.informationSaved {
                    Text("Изменения сохранены").foregroundStyle(DesignTokens.colorAccent)
                        .accessibilityIdentifier("settings-saved")
                }
                MeetingInfoHeading(owner: owner, meeting: meeting)
                MeetingInfoFacts(meeting: meeting)
                if let text = meeting.description, !text.isEmpty {
                    Text(text).designFont(DesignTokens.typographySizeSmall)
                        .lineSpacing(DesignTokens.spaceS4).foregroundStyle(DesignTokens.colorMuted)
                        .textSelection(.enabled).fixedSize(horizontal: false, vertical: true)
                }
                MeetingInfoPeople(
                    id: owner.id, session: owner.session,
                    expanded: Binding(
                        get: { owner.informationExpanded }, set: { owner.informationExpanded = $0 })
                ).padding(.top, DesignTokens.spaceS20)
                    .overlay(alignment: .top) {
                        Rectangle().fill(DesignTokens.colorLine).frame(height: DesignTokens.spaceS1)
                    }
            }
        } footer: {
            if ready { MeetingInfoFooter(owner: owner) }
        }
        .task(id: reloadID) {
            if owner.informationReturn != nil {
                owner.informationReturn = nil
            } else {
                await owner.reloadDetails(version: owner.generation)
                await owner.openInfo()
            }
        }
    }
}
