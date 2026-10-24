import SwiftUI

struct SavedInvitationsView: View {
    let owner: SavedInvitationsOwner
    @Binding var invitations: Bool
    let create: () -> Void
    @State private var target: InvitationTarget?
    @Environment(\.scenePhase) private var phase

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 16) {
                if owner.page.value == nil && owner.page.error == nil {
                    SavedInvitationsLoading()
                } else {
                    if owner.page.error != nil {
                        StatusView(
                            title: owner.page.value == nil
                                ? "Не удалось загрузить приглашения"
                                : "Не удалось обновить приглашения", retry: { owner.refresh() })
                    }
                    if owner.items.isEmpty && owner.page.error == nil {
                        StatusView(
                            title: "Пока нет приглашений",
                            text: "Здесь будут встречи, на которые вы ответили «Возможно».")
                    }
                    ForEach(owner.items) { item in
                        SavedInvitationCard(item: item) { target = owner.target(item) }
                    }
                    if owner.page.value?.nextCursor != nil {
                        ActionButton(
                            title: "Показать ещё", primary: false, busy: owner.page.isLoading
                        ) { owner.refresh(more: true) }
                    }
                }
            }.padding(24)
        }
        .accessibilityIdentifier("saved-invitations-list")
        .background(AppPalette.background)
        .safeAreaInset(edge: .top, spacing: 0) {
            VStack(spacing: 16) {
                MeetingListHeading(empty: false, create: create)
                HomeTabs(invitations: $invitations)
            }.padding(.horizontal, 24).padding(.vertical, 12).background(AppPalette.background)
        }
        .refreshable { await owner.load() }
        .task(id: "\(phase)-\(target?.id ?? "")") {
            if phase == .active && target == nil { await owner.load() }
        }
        .onDisappear { owner.cancel() }
        .sheet(item: $target) { target in
            NavigationStack {
                InvitationRouteView(
                    target: target, api: owner.session.api, session: owner.session, warning: nil,
                    close: { self.target = nil })
            }.preferredColorScheme(.dark).presentationDragIndicator(.visible)
        }
    }
}
