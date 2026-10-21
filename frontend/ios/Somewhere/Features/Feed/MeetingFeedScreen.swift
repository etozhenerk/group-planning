import SwiftUI

struct MeetingFeedScreen: View {
    @State private var owner: FeedOwner
    @Environment(\.scenePhase) private var phase
    init(id: UUID, session: SessionStore, invitation: InvitationOwner) {
        _owner = State(initialValue: FeedOwner(id: id, session: session, invitation: invitation))
    }
    var body: some View {
        VStack(spacing: 0) {
            if owner.current {
                if let problem = owner.problem {
                    HStack {
                        Text(problem).font(.footnote)
                        Spacer()
                        Button("Повторить", action: owner.reload)
                    }.foregroundStyle(AppPalette.error).padding(16)
                }
                if !owner.loaded && owner.problem == nil {
                    StatusView(title: "Загружаем разговор…", loading: true)
                } else {
                    FeedTimeline(owner: owner)
                }
            }
        }.background(AppPalette.background)
            .safeAreaInset(edge: .bottom, spacing: 0) {
                if owner.current { MessageComposer(owner: owner) }
            }
            .toolbar(.hidden, for: .navigationBar)
            .safeAreaInset(edge: .top, spacing: 0) {
                if owner.current { MeetingFeedHeader(owner: owner) }
            }
            .sheet(isPresented: $owner.infoPresented) { MeetingInfoScreen(owner: owner) }
            .task(id: phase) {
                guard phase == .active else {
                    owner.suspend()
                    return
                }
                await owner.refresh()
                while !Task.isCancelled, owner.current {
                    do { try await Task.sleep(for: .seconds(3)) } catch { return }
                    await owner.refresh()
                }
            }
            .onChange(of: owner.current) { _, current in if !current { owner.clear() } }
            .onDisappear { owner.suspend() }
    }
}
