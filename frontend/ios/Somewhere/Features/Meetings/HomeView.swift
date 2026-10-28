import SwiftUI

struct HomeView: View {
    let session: SessionStore
    let user: UserProfile
    let drafts: DraftRepository
    let deleteAccount: () -> Void
    @Environment(\.scenePhase) private var scenePhase
    @State private var owner: MeetingListOwner
    @State private var savedInvitations: SavedInvitationsOwner
    @State private var section: HomeSection = .meetings
    @State private var path: [UUID] = []
    @State private var showingCreate = false
    @State private var creator: CreationOwner?
    @State private var refreshID = UUID()

    init(
        session: SessionStore, user: UserProfile, drafts: DraftRepository,
        deleteAccount: @escaping () -> Void = {}
    ) {
        self.session = session
        self.user = user
        self.drafts = drafts
        self.deleteAccount = deleteAccount
        _owner = State(initialValue: MeetingListOwner(session: session))
        _savedInvitations = State(initialValue: SavedInvitationsOwner(session: session))
    }

    var body: some View {
        NavigationStack(path: $path) {
            ZStack {
                if section == .profile {
                    ProfileScreen(
                        session: session, logout: owner.logout, deleteAccount: deleteAccount)
                } else if section == .invitations {
                    SavedInvitationsView(
                        owner: savedInvitations, invitations: invitations, create: openCreate)
                } else {
                    MeetingListView(
                        owner: owner, create: openCreate, select: { path.append($0) },
                        invitations: invitations
                    )
                    .refreshable { await owner.load() }
                }
            }
            .toolbar(.hidden, for: .navigationBar)
            .safeAreaInset(edge: .top, spacing: 0) {
                HStack {
                    BrandWordmark(compact: true).dynamicTypeSize(...DynamicTypeSize.xxxLarge)
                    Spacer()
                }.padding(.horizontal, 20).padding(.top, 17)
                    .background(AppPalette.background)
            }
            .overlay(alignment: .bottom) { HomeNavigation(selection: $section) }
            .navigationDestination(for: UUID.self) { id in
                MeetingSnapshotView(id: id, session: session)
            }
            .task(
                id:
                    "\(refreshID)-\(owner.selectionID)-\(scenePhase)-\(path.isEmpty)-\(showingCreate)-\(section.rawValue)"
            ) {
                if scenePhase == .active && path.isEmpty && !showingCreate && section == .meetings {
                    await owner.observe()
                }
            }
            .onDisappear { owner.cancel() }
        }
        .fullScreenCover(isPresented: $showingCreate) {
            if let creator { CreateMeetingScreen(owner: creator, openMeeting: { path.append($0) }) }
        }
        .onChange(of: showingCreate) { old, new in if old && !new { refreshID = UUID() } }
        .environment(\.avatarImages, session.privateData.avatars)
        .tint(AppPalette.accent)
    }

    private var invitations: Binding<Bool> {
        Binding(get: { section == .invitations }, set: { section = $0 ? .invitations : .meetings })
    }

    private func openCreate() {
        creator = CreationOwner(
            userID: user.id, session: session, drafts: drafts,
            initialDay: section == .meetings ? owner.selection.creationDay : nil)
        showingCreate = true
    }
}
