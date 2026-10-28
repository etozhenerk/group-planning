import SwiftUI

struct InvitationScreen: View {
    @State private var owner: InvitationOwner
    @Environment(\.scenePhase) private var phase
    var warning: String?
    let allowsPullToRefresh: Bool
    var authenticating: Bool
    var signIn: () -> Void

    init(
        target: InvitationTarget, api: APIClient, session: SessionStore?, warning: String? = nil,
        allowsPullToRefresh: Bool = true,
        authenticating: Bool = false, signIn: @escaping () -> Void = {}
    ) {
        _owner = State(initialValue: InvitationOwner(target: target, api: api, session: session))
        self.warning = warning
        self.allowsPullToRefresh = allowsPullToRefresh
        self.authenticating = authenticating
        self.signIn = signIn
    }

    var body: some View {
        Group {
            if owner.canAccess, let value = owner.preview, let session = owner.session,
                !session.privateData.denied.contains(value.meetingID)
            {
                MeetingFeedScreen(id: value.meetingID, session: session, invitation: owner)
            } else if allowsPullToRefresh {
                invitation.refreshable { await owner.load() }
            } else {
                invitation
            }
        }
        .task(id: phase) {
            guard phase == .active else {
                owner.suspend()
                return
            }
            if !owner.canAccess { await owner.load() }
            while !Task.isCancelled, !owner.unavailable {
                do { try await Task.sleep(for: .seconds(5)) } catch { return }
                if (!owner.canAccess
                    || owner.preview.map {
                        owner.session?.privateData.denied.contains($0.meetingID) == true
                    } == true)
                    && !owner.loading && !owner.saving && owner.pending == nil
                    && owner.choice == owner.answer
                {
                    await owner.load()
                }
            }
        }
        .onDisappear { owner.cancel() }
    }
    private var invitation: some View {
        ScrollView(.vertical, showsIndicators: false) {
            VStack(alignment: .leading, spacing: 28) {
                if let value = owner.preview {
                    InvitationFactsView(value: value, api: owner.api, session: owner.session)
                    if let warning {
                        Text(warning).font(.footnote).foregroundStyle(AppPalette.error)
                    }
                    if owner.organizer {
                        OrganizerInvitationView(owner: owner)
                    } else {
                        RSVPFormView(owner: owner, authenticating: authenticating, signIn: signIn)
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

    }
}
