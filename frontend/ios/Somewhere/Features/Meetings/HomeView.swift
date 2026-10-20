import SwiftUI

struct HomeView: View {
    let session: SessionStore
    let user: UserProfile
    let drafts: DraftRepository
    @State private var owner: MeetingListOwner
    @State private var path: [UUID] = []
    @State private var showingCreate = false
    @State private var creator: CreationOwner?
    @State private var refreshID = UUID()

    init(session: SessionStore, user: UserProfile, drafts: DraftRepository) {
        self.session = session
        self.user = user
        self.drafts = drafts
        _owner = State(initialValue: MeetingListOwner(session: session))
    }

    var body: some View {
        NavigationStack(path: $path) {
            MeetingListView(owner: owner, create: openCreate, select: { path.append($0) })
                .toolbar {
                    ToolbarItem(placement: .topBarLeading) { BrandWordmark(compact: true) }
                    ToolbarItem(placement: .topBarTrailing) {
                        Menu {
                            Text(user.displayName)
                            Button("Выйти из аккаунта", role: .destructive) { owner.logout() }
                        } label: {
                            Image(systemName: "person.crop.circle").font(.title2).foregroundStyle(
                                AppPalette.muted
                            ).frame(minWidth: 44, minHeight: 44)
                        }.accessibilityLabel("Профиль: " + user.displayName)
                    }
                }
                .toolbarBackground(AppPalette.background, for: .navigationBar)
                .navigationDestination(for: UUID.self) { id in
                    MeetingSnapshotView(id: id, session: session)
                }
                .task(id: refreshID) { await owner.load() }
                .refreshable { await owner.load() }
                .onDisappear { owner.cancel() }
        }
        .fullScreenCover(isPresented: $showingCreate) {
            if let creator { CreateMeetingScreen(owner: creator, openMeeting: { path.append($0) }) }
        }
        .onChange(of: showingCreate) { old, new in if old && !new { refreshID = UUID() } }
        .tint(AppPalette.accent)
    }

    private func openCreate() {
        creator = CreationOwner(userID: user.id, session: session, drafts: drafts)
        showingCreate = true
    }
}
