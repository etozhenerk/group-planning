import SwiftUI

struct SavedInvitationsView: View {
    let owner: SavedInvitationsOwner
    @Binding var invitations: Bool
    @State private var target: InvitationTarget?
    @Environment(\.scenePhase) private var phase
    @Environment(\.dynamicTypeSize) private var typeSize

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: DesignTokens.spaceS8) {
                if typeSize.isAccessibilitySize {
                    SavedInvitationsExplanation().padding(.bottom, DesignTokens.spaceS20)
                }
                if owner.page.value == nil && owner.page.error == nil {
                    SavedInvitationsLoading()
                } else {
                    if owner.page.error != nil {
                        MobileStatusView(
                            title: owner.page.value == nil
                                ? "Не удалось загрузить приглашения"
                                : "Не удалось обновить приглашения",
                            refresh: owner.page.value != nil,
                            retry: { owner.refresh() }, large: false)
                    }
                    if owner.items.isEmpty && owner.page.error == nil {
                        MobileStatusView(
                            title: "Приглашений пока нет", refresh: false,
                            retry: { invitations = false }, large: false, symbol: "envelope",
                            actionLabel: "К моим встречам", actionSymbol: nil)
                    }
                    ForEach(owner.items) { item in
                        SavedInvitationCard(item: item, api: owner.session.api) {
                            target = owner.target(item)
                        }
                    }
                    if owner.page.value?.nextCursor != nil {
                        ActionButton(
                            title: "Показать ещё", primary: false, busy: owner.page.isLoading
                        ) {
                            owner.refresh(more: true)
                        }
                    }
                }
            }
            .padding(.horizontal, DesignTokens.spaceS20).padding(.top, DesignTokens.spaceS4)
            .padding(.bottom, DesignTokens.componentMobileInvitationsScrollBottom)
        }
        .accessibilityIdentifier("saved-invitations-list")
        .safeAreaInset(edge: .top, spacing: DesignTokens.spaceS0) {
            VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
                SavedInvitationsHeader(
                    count: owner.page.value == nil ? nil : owner.items.count,
                    hasMore: owner.page.value?.nextCursor != nil)
                if !typeSize.isAccessibilitySize {
                    SavedInvitationsExplanation().padding(.bottom, DesignTokens.spaceS20)
                }
            }
            .padding(.horizontal, DesignTokens.spaceS20).background(AppPalette.background)
        }
        .background(AppPalette.background).refreshable { await owner.load() }
        .onChange(of: target?.id) { old, new in
            if old != nil && new == nil && phase == .active { owner.refresh() }
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
