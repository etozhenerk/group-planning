import SwiftUI

struct MeetingInfoScreen: View {
    let owner: FeedOwner
    @State private var reloadID = UUID()

    var body: some View {
        ActionFormSheet(
            title: "О встрече", scrollIdentifier: "meeting-info",
            headerIdentifier: "meeting-info-header",
            scrollOffset: Binding(
                get: { owner.informationScrollOffset }, set: { owner.informationScrollOffset = $0 }),
            stickyFooter: true
        ) {
            if owner.current {
                if owner.session.privateData.details[owner.id]?.error != nil {
                    StatusView(title: "Не удалось обновить информацию") { reloadID = UUID() }
                } else if owner.meeting == nil {
                    StatusView(title: "Загружаем информацию…", loading: true)
                }
            }
            if owner.current, let meeting = owner.meeting {
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
            if owner.current, owner.meeting != nil { MeetingInfoFooter(owner: owner) }
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
