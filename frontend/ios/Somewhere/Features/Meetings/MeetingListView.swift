import SwiftUI

struct MeetingListView: View {
    let owner: MeetingListOwner
    let create: () -> Void
    let select: (UUID) -> Void
    @Binding var invitations: Bool

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                MeetingListHeading(
                    empty: owner.selection.display == .list && owner.empty, create: create
                )
                .padding(.bottom, 24)
                MeetingToolbar(owner: owner).padding(.bottom, 22)
                if owner.selection.display == .calendar {
                    MeetingCalendarView(owner: owner, create: create, select: select)
                } else {
                    MeetingResultsView(owner: owner, create: create, select: select)
                    UndatedMeetingsButton(owner: owner).padding(.top, 20)
                }
            }.padding(.horizontal, 20).padding(.top, 28).padding(.bottom, 110)
                .frame(maxWidth: .infinity, alignment: .leading)
        }.defaultScrollAnchor(.top).accessibilityIdentifier("meetings-list")
            .background(AppPalette.background)
    }
}
