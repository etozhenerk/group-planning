import SwiftUI

struct SavedInvitationsLoading: View {
    var body: some View {
        DeferredPlaceholder { MeetingCardsSkeleton(label: "Загрузка приглашений") }
    }
}
