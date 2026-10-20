import SwiftUI

struct InvitationRouteView: View {
    let target: InvitationTarget
    let api: APIClient
    let session: SessionStore?
    let warning: String?
    let close: () -> Void
    var body: some View {
        InvitationScreen(target: target, api: api, session: session, warning: warning)
            .id(target.id + ":" + (session?.profile?.id.uuidString ?? "anonymous"))
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Закрыть", action: close)
                }
            }
    }
}
