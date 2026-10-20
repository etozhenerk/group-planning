import SwiftUI

struct MeetingSnapshotView: View {
    let id: UUID
    let session: SessionStore
    var body: some View {
        InvitationScreen(target: .meeting(id), api: session.api, session: session)
            .id(session.profile?.id)
    }
}
