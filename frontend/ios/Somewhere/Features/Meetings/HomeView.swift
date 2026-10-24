import SwiftUI

struct HomeView: View {
    let session: SessionStore
    let user: UserProfile
    let drafts: DraftRepository
    @Environment(\.scenePhase) private var scenePhase
    @State private var owner: MeetingListOwner
    @State private var savedInvitations: SavedInvitationsOwner
    @State private var invitations = false
    @State private var path: [UUID] = []
    @State private var showingCreate = false
    @State private var creator: CreationOwner?
    @State private var refreshID = UUID()

    init(session: SessionStore, user: UserProfile, drafts: DraftRepository) {
        self.session = session
        self.user = user
        self.drafts = drafts
        _owner = State(initialValue: MeetingListOwner(session: session))
        _savedInvitations = State(initialValue: SavedInvitationsOwner(session: session))
    }

    var body: some View {
        NavigationStack(path: $path) {
            Group {
                if invitations {
                    SavedInvitationsView(
                        owner: savedInvitations, invitations: $invitations, create: openCreate)
                } else {
                    MeetingListView(
                        owner: owner, create: openCreate, select: { path.append($0) },
                        invitations: $invitations
                    )
                    .refreshable { await owner.load() }
                }
            }
            .toolbar(.hidden, for: .navigationBar)
            .safeAreaInset(edge: .top, spacing: 0) {
                MeetingHomeHeader(user: user, logout: owner.logout)
            }
            .navigationDestination(for: UUID.self) { id in
                MeetingSnapshotView(id: id, session: session)
            }
            .task(
                id:
                    "\(refreshID)-\(owner.selectionID)-\(scenePhase)-\(path.isEmpty)-\(showingCreate)-\(invitations)"
            ) {
                if scenePhase == .active && path.isEmpty && !showingCreate && !invitations {
                    await owner.observe()
                }
            }
            .onDisappear { owner.cancel() }
        }
        .fullScreenCover(isPresented: $showingCreate) {
            if let creator { CreateMeetingScreen(owner: creator, openMeeting: { path.append($0) }) }
        }
        .onChange(of: showingCreate) { old, new in if old && !new { refreshID = UUID() } }
        .tint(AppPalette.accent)
    }

    private func openCreate() {
        creator = CreationOwner(
            userID: user.id, session: session, drafts: drafts,
            initialDay: invitations ? nil : owner.selection.creationDay)
        showingCreate = true
    }
}
