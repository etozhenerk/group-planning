import SwiftUI

struct InvitationScreen: View {
    @State private var owner: InvitationOwner
    @Environment(\.scenePhase) private var phase
    var warning: String?

    init(target: InvitationTarget, api: APIClient, session: SessionStore?, warning: String? = nil) {
        _owner = State(initialValue: InvitationOwner(target: target, api: api, session: session))
        self.warning = warning
    }

    var body: some View {
        ScrollView(.vertical, showsIndicators: false) {
            VStack(alignment: .leading, spacing: 28) {
                if let value = owner.preview {
                    InvitationFactsView(value: value)
                    if let warning {
                        Text(warning).font(.footnote).foregroundStyle(AppPalette.error)
                    }
                    if owner.organizer {
                        OrganizerInvitationView(owner: owner)
                    } else {
                        RSVPFormView(owner: owner)
                    }
                    if owner.canAccess, let session = owner.session,
                        !session.privateData.denied.contains(value.meetingID)
                    {
                        MeetingPeopleView(id: value.meetingID, session: session)
                        ConversationPreviewView(id: value.meetingID, session: session)
                    }
                    if let problem = owner.problem {
                        Text(problem).foregroundStyle(AppPalette.error)
                    }
                } else if let problem = owner.problem {
                    StatusView(
                        title: problem,
                        text: owner.unavailable
                            ? "Попросите организатора прислать действующую ссылку."
                            : "Проверьте соединение и попробуйте ещё раз.",
                        retry: owner.unavailable ? nil : { owner.reload() })
                } else {
                    StatusView(title: "Открываем приглашение…", loading: true)
                }
            }.padding(24)
        }
        .background(AppPalette.background).navigationTitle("Встреча")
        .navigationBarTitleDisplayMode(.inline).accessibilityIdentifier("invitation-screen")
        .refreshable { await owner.load() }
        .task(id: phase) {
            guard phase == .active else {
                owner.suspend()
                return
            }
            await owner.load()
            while !Task.isCancelled, !owner.unavailable {
                do { try await Task.sleep(for: .seconds(5)) } catch { return }
                if !owner.loading && !owner.saving && owner.pending == nil
                    && owner.choice == owner.answer
                {
                    await owner.load()
                }
            }
        }
        .onDisappear { owner.cancel() }
    }
}
