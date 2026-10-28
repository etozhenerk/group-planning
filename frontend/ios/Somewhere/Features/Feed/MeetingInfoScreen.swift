import SwiftUI

struct MeetingInfoScreen: View {
    let owner: FeedOwner
    @State private var reloadID = UUID()
    @AccessibilityFocusState private var restoredAction: ChatSheetRoute?

    var body: some View {
        ActionFormSheet(
            title: owner.meeting?.title ?? "О встрече", scrollIdentifier: "meeting-info",
            headerIdentifier: "meeting-info-header",
            scrollOffset: Binding(
                get: { owner.informationScrollOffset }, set: { owner.informationScrollOffset = $0 })
        ) {
            if owner.current {
                if owner.session.privateData.details[owner.id]?.error != nil {
                    StatusView(title: "Не удалось обновить информацию") { reloadID = UUID() }
                } else if owner.meeting == nil {
                    StatusView(title: "Загружаем информацию…", loading: true)
                }
            }
            if owner.current, let meeting = owner.meeting {
                MeetingInfoFacts(meeting: meeting)
                MeetingInfoPeople(
                    id: owner.id, session: owner.session,
                    expanded: Binding(
                        get: { owner.informationExpanded }, set: { owner.informationExpanded = $0 })
                )
                if owner.invitation.organizer {
                    VStack(spacing: DesignTokens.spaceS0) {
                        if let url = owner.invitation.shareURL {
                            ShareLink(item: url, preview: SharePreview(meeting.title)) {
                                HStack(spacing: DesignTokens.spaceS12) {
                                    ChatIcon(kind: .share)
                                    Text("Пригласить друзей")
                                    Spacer(minLength: DesignTokens.spaceS0)
                                }.designFont(DesignTokens.typographySizeButton)
                                    .frame(
                                        minHeight: DesignTokens.componentMobileRosterActionHeight
                                    )
                                    .contentShape(Rectangle())
                            }.buttonStyle(ChatPressStyle()).accessibilityIdentifier(
                                "meeting-info-share")
                        }
                        action(
                            "Настройки встречи", icon: .settings, route: .settings,
                            identifier: "edit-meeting")
                    }.overlay(alignment: .top) {
                        Rectangle().fill(DesignTokens.colorLine).frame(height: DesignTokens.spaceS1)
                    }
                } else {
                    RSVPFormView(owner: owner.invitation, compact: true)
                }
            }
        }.task(id: reloadID) {
            if let route = owner.informationReturn {
                restoredAction = route
                owner.informationReturn = nil
            } else {
                await owner.reloadDetails(version: owner.generation)
                await owner.openInfo()
            }
        }
    }

    private func action(
        _ title: String, icon: ChatIcon.Kind, route: ChatSheetRoute, identifier: String
    ) -> some View {
        Button {
            owner.openSheet(route, child: true)
        } label: {
            HStack(spacing: DesignTokens.spaceS12) {
                ChatIcon(kind: icon, size: DesignTokens.componentMobileRosterActionIcon)
                    .foregroundStyle(DesignTokens.colorMuted)
                Text(title).designFont(DesignTokens.typographySizeButton)
                Spacer(minLength: DesignTokens.spaceS0)
                ChatIcon(kind: .right, size: DesignTokens.componentMobileRosterActionIcon)
                    .foregroundStyle(DesignTokens.colorMuted)
            }.frame(minHeight: DesignTokens.componentMobileRosterActionHeight).contentShape(
                Rectangle())
        }.buttonStyle(ChatPressStyle()).accessibilityIdentifier(identifier).accessibilityFocused(
            $restoredAction, equals: route)
    }
}
