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
    @State private var path: [HomeDestination] = []
    @Binding private var responseDestination: RSVPOutcome?
    @State private var showingCreate = false
    @State private var creator: CreationOwner?
    @State private var refreshID = UUID()

    init(
        session: SessionStore, user: UserProfile, drafts: DraftRepository,
        deleteAccount: @escaping () -> Void = {},
        responseDestination: Binding<RSVPOutcome?> = .constant(nil)
    ) {
        self.session = session
        self.user = user
        self.drafts = drafts
        self.deleteAccount = deleteAccount
        _responseDestination = responseDestination
        _owner = State(initialValue: MeetingListOwner(session: session))
        _savedInvitations = State(initialValue: SavedInvitationsOwner(session: session))
    }

    var body: some View {
        NavigationStack(path: $path) {
            ZStack {
                if section == .profile {
                    ProfileScreen(
                        session: session, logoutBusy: owner.loggingOut,
                        logoutFailure: owner.logoutFailure, logout: owner.logout)
                } else if section == .invitations {
                    SavedInvitationsView(
                        owner: savedInvitations, invitations: invitations)
                } else {
                    MeetingListView(
                        owner: owner, create: openCreate, select: { path.append(.meeting($0)) },
                        invitations: invitations
                    )
                    .refreshable { await owner.load() }
                }
            }
            .toolbar(.hidden, for: .navigationBar)
            .safeAreaInset(edge: .top, spacing: 0) {
                if section != .profile {
                    HStack {
                        BrandWordmark(compact: true).dynamicTypeSize(...DynamicTypeSize.xxxLarge)
                        Spacer()
                    }.padding(.horizontal, 20).padding(.top, 17)
                        .background(AppPalette.background)
                }
            }
            .safeAreaInset(edge: .bottom, spacing: DesignTokens.spaceS0) {
                HomeNavigation(selection: $section)
            }
            .navigationDestination(for: HomeDestination.self) { destination in
                switch destination {
                case .meeting(let id): MeetingSnapshotView(id: id, session: session)
                case .declined(let title):
                    DeclinedResponseScreen(title: title) {
                        section = .meetings
                        path = []
                    }
                }
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
            if let creator {
                CreateMeetingScreen(owner: creator, openMeeting: { path.append(.meeting($0)) })
            }
        }
        .task(id: "\(scenePhase)-\(path.isEmpty)-\(section.rawValue)-\(refreshID)") {
            if scenePhase == .active && path.isEmpty && section == .invitations {
                await savedInvitations.load()
            }
        }
        .onChange(of: showingCreate) { old, new in if old && !new { refreshID = UUID() } }
        .onChange(of: responseDestination) { _, destination in
            guard let destination else { return }
            switch destination {
            case .going(let id):
                section = .meetings
                path = [.meeting(id)]
            case .maybe:
                savedInvitations.invalidate()
                refreshID = UUID()
                section = .invitations
                path = []
            case .declined(let title):
                section = .meetings
                path = [.declined(title)]
            }
            responseDestination = nil
        }
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
