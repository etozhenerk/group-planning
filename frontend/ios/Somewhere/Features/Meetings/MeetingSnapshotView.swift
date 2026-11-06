import SwiftUI

struct MeetingSnapshotView: View {
    let id: UUID
    let session: SessionStore
    var publicToken: String? = nil
    var body: some View {
        InvitationScreen(
            target: .meeting(id, publicToken: publicToken), api: session.api, session: session
        )
        .id(session.profile?.id)
    }
}
