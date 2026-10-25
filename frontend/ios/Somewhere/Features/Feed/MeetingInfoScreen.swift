import SwiftUI

struct MeetingInfoScreen: View {
    let owner: FeedOwner
    @State private var reloadID = UUID()
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        NavigationStack {
            ScrollView {
                if owner.current {
                    if owner.session.privateData.details[owner.id]?.error != nil {
                        StatusView(title: "Не удалось обновить информацию") { reloadID = UUID() }
                    } else if owner.meeting == nil {
                        StatusView(title: "Загружаем информацию…", loading: true)
                    }
                }
                if owner.current, let meeting = owner.meeting {
                    VStack(alignment: .leading, spacing: 28) {
                        MeetingInfoFacts(meeting: meeting)
                        if let url = meeting.coverURL {
                            CoverImageView(
                                source: .remote(url, meeting.id), api: owner.session.api,
                                session: owner.session)
                        }
                        if owner.invitation.organizer {
                            OrganizerInvitationView(owner: owner.invitation)
                            NavigationLink {
                                MeetingSettingsScreen(meeting: meeting, session: owner.session)
                            } label: {
                                Label(
                                    "Редактировать встречу", systemImage: "slider.horizontal.3"
                                )
                                .frame(minHeight: 44)
                            }.accessibilityIdentifier("edit-meeting")
                        } else {
                            RSVPFormView(owner: owner.invitation)
                        }
                        MeetingPeopleView(id: owner.id, session: owner.session)
                    }.padding(24)
                }
            }.background(AppPalette.surface).accessibilityIdentifier("meeting-info")
                .toolbar(.hidden, for: .navigationBar)
                .safeAreaInset(edge: .top, spacing: 0) {
                    MeetingPanelHeader(title: "О встрече") { dismiss() }
                }
                .task(id: reloadID) {
                    await owner.reloadDetails(version: owner.generation)
                    await owner.openInfo()
                }
        }.presentationDragIndicator(.visible).presentationBackground(AppPalette.surface)
    }
}
