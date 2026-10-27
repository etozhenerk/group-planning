import SwiftUI

struct MeetingFeedScreen: View {
    @State private var owner: FeedOwner
    @State private var sheetDismissal = 0
    @Environment(\.scenePhase) private var phase
    init(id: UUID, session: SessionStore, invitation: InvitationOwner) {
        _owner = State(initialValue: FeedOwner(id: id, session: session, invitation: invitation))
    }
    var body: some View {
        GeometryReader { viewport in
            VStack(spacing: 0) {
                if owner.current {
                    if owner.meeting?.period == "past" { MemoriesBanner(owner: owner.memories) }
                    if let problem = owner.problem {
                        HStack {
                            Text(problem).font(.footnote)
                            Spacer()
                            Button("Повторить", action: owner.reload)
                        }.foregroundStyle(AppPalette.error).padding(16)
                    }
                    if !owner.loaded && owner.problem == nil {
                        ChatConversationSkeleton()
                            .padding(DesignTokens.spaceS16)
                        Spacer(minLength: DesignTokens.spaceS0)
                    } else {
                        FeedTimeline(owner: owner)
                    }
                }
            }.background(AppPalette.background)
                .safeAreaInset(edge: .bottom, spacing: 0) {
                    if owner.current {
                        MessageComposer(owner: owner, availableHeight: viewport.size.height)
                    }
                }
                .toolbar(.hidden, for: .navigationBar)
                .safeAreaInset(edge: .top, spacing: 0) {
                    if owner.current {
                        MeetingFeedHeader(
                            owner: owner, viewport: viewport.size, sheetDismissal: sheetDismissal)
                    }
                }
                .accessibilityHidden(!owner.sheets.isEmpty)
                .sheet(
                    isPresented: Binding(
                        get: { !owner.sheets.isEmpty },
                        set: { presented in
                            if !presented { owner.closeSheet() }
                        }),
                    onDismiss: {
                        owner.reload()
                        sheetDismissal += 1
                    }
                ) {
                    ChatSheetContent(owner: owner)
                }
                .onChange(of: owner.media.entries.count) { _, _ in
                    do { try owner.merge(owner.media.entries) } catch {
                        owner.problem = "Не удалось обновить вложения."
                    }
                }
                .task(id: phase) {
                    guard phase == .active else {
                        owner.suspend()
                        return
                    }
                    await owner.run()
                }
                .onChange(of: owner.current) { _, current in if !current { owner.clear() } }
                .onDisappear { owner.suspend() }
        }
    }
}
