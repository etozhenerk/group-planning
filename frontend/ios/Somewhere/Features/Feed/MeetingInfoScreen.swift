import SwiftUI

struct MeetingInfoScreen: View {
    let owner: FeedOwner
    @State private var reloadID = UUID()
    @State private var settingsPresented = false
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        ActionFormSheet(
            title: owner.meeting?.title ?? "О встрече", scrollIdentifier: "meeting-info",
            closeIdentifier: "meeting-info-close"
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
                if let url = meeting.coverURL {
                    CoverImageView(
                        source: .remote(url, meeting.id), api: owner.session.api,
                        session: owner.session)
                }
                MeetingPeopleView(id: owner.id, session: owner.session)
                if owner.invitation.organizer {
                    OrganizerInvitationView(owner: owner.invitation, secondary: true)
                    Button {
                        settingsPresented = true
                    } label: {
                        Label(
                            "Редактировать встречу", systemImage: "slider.horizontal.3"
                        )
                        .frame(minHeight: DesignTokens.targetIos)
                    }.accessibilityIdentifier("edit-meeting")
                } else {
                    RSVPFormView(owner: owner.invitation)
                }
            }
        }.task(id: reloadID) {
            await owner.reloadDetails(version: owner.generation)
            await owner.openInfo()
        }.sheet(isPresented: $settingsPresented, onDismiss: { owner.reload() }) {
            if let meeting = owner.meeting {
                MeetingSettingsScreen(
                    owner: owner.actionDrafts.settings(meeting: meeting),
                    completed: owner.actionDrafts.clearSettings)
            }
        }.onChange(of: owner.current) { _, current in
            if !current { dismiss() }
        }
    }
}
