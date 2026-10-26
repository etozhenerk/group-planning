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
                if owner.meeting?.period == "past" { MemoriesBanner(owner: owner.memories) }
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
            .sheet(
                isPresented: $owner.mediaPresented,
                onDismiss: {
                    owner.composerFocused = true
                    owner.reload()
                }
            ) {
                MediaPickerPanel(owner: owner.media, photosOnly: owner.photoSelection)
            }
            .onChange(of: owner.media.entries.count) { _, _ in
                do { try owner.merge(owner.media.entries) } catch {
                    owner.problem = "Не удалось обновить вложения."
                }
            }
            .sheet(isPresented: $owner.infoPresented) { MeetingInfoScreen(owner: owner) }
            .sheet(
                isPresented: $owner.pollPresented,
                onDismiss: {
                    owner.composerFocused = true
                    owner.reload()
                }
            ) {
                if let meeting = owner.meeting {
                    CreateDatePollScreen(
                        form: owner.actionDrafts.date(meeting: meeting),
                        completed: owner.actionDrafts.clearDate)
                }
            }
            .sheet(
                isPresented: $owner.placePollPresented,
                onDismiss: {
                    owner.composerFocused = true
                    owner.reload()
                }
            ) {
                if let meeting = owner.meeting {
                    CreatePlacePollScreen(
                        form: owner.actionDrafts.place(meeting: meeting),
                        completed: owner.actionDrafts.clearPlace)
                }
            }
            .sheet(
                isPresented: $owner.preparationTaskPresented,
                onDismiss: {
                    owner.composerFocused = true
                    owner.reload()
                }
            ) {
                CreatePreparationTaskScreen(
                    form: owner.actionDrafts.preparation(),
                    completed: owner.actionDrafts.clearPreparation)
            }
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
