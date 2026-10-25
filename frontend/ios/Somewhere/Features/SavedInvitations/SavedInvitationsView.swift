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
                Text("Приглашения").designFont(28, weight: .bold).tracking(-0.9).padding(
                    .bottom, 4)
                Text(
                    "Здесь сохранены приглашения, на которые вы ответили «Возможно». Когда определитесь, откройте приглашение и измените ответ."
                )
                .designFont(13).lineSpacing(5).foregroundStyle(AppPalette.muted).padding(
                    .bottom, 16)

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
                        VStack(spacing: 14) {
                            ExperienceIcon(kind: .envelope, size: 22)
                            Text("Пока ничего нет").designFont(22, weight: .bold)
                            Button {
                                invitations = false
                            } label: {
                                Text("К моим встречам").designFont(14, weight: .semibold)
                                    .padding(.horizontal, 18).frame(minHeight: 47)
                                    .overlay {
                                        RoundedRectangle(cornerRadius: 13).stroke(
                                            .white.opacity(0.125), lineWidth: 1)
                                    }
                            }
                        }.padding(.horizontal, 20).padding(.vertical, 55)
                            .frame(maxWidth: .infinity)
                            .background(
                                .white.opacity(0.012), in: RoundedRectangle(cornerRadius: 22))
                    }
                    ForEach(owner.items) { item in
                        SavedInvitationCard(item: item, api: owner.session.api) {
                            target = owner.target(item)
                        }
                    }
                    if owner.page.value?.nextCursor != nil {
                        ActionButton(
                            title: "Показать ещё", primary: false, busy: owner.page.isLoading
                        ) { owner.refresh(more: true) }
                    }
                }
            }.padding(.horizontal, 20).padding(.top, 28).padding(.bottom, 110)
        }
        .accessibilityIdentifier("saved-invitations-list")
        .background(AppPalette.background)
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
