import SwiftUI

struct InvitationRouteView: View {
    let target: InvitationTarget
    let api: APIClient
    let session: SessionStore?
    let warning: String?
    let close: () -> Void
    var authenticating = false
    var signIn: () -> Void = {}
    @State private var retry = 0
    var body: some View {
        Group {
            if session?.status == .failed {
                StatusView(
                    title: "Не удалось проверить вход",
                    text: "Проверьте соединение и попробуйте ещё раз.",
                    retry: { retry += 1 })
            } else if session?.status == .restoring {
                LaunchLoadingView()
            } else {
                InvitationScreen(
                    target: target, api: api, session: session, warning: warning,
                    authenticating: authenticating, signIn: signIn
                )
                .id(target.id + ":" + (session?.profile?.id.uuidString ?? "anonymous"))
            }
        }
        .task(id: retry) {
            if retry > 0 { await session?.restore() }
        }
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("Закрыть", action: close)
            }
        }
    }
}
