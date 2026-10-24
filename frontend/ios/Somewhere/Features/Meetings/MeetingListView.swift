import SwiftUI

struct MeetingListView: View {
    let owner: MeetingListOwner
    let create: () -> Void
    let select: (UUID) -> Void
    @Binding var invitations: Bool
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var scrolled = false

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    MeetingToolbar(owner: owner)
                    if owner.selection.display == .calendar {
                        MeetingCalendarView(owner: owner, create: create, select: select)
                    } else {
                        MeetingResultsView(owner: owner, create: create, select: select)
                        UndatedMeetingsButton(owner: owner)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading).padding(24)
                .onGeometryChange(for: Bool.self) { geometry in
                    geometry.frame(in: .scrollView(axis: .vertical)).minY < -1
                } action: { value in
                    scrolled = value
                }
            }
            .defaultScrollAnchor(.top)
            .accessibilityIdentifier("meetings-list")
        }
        .safeAreaInset(edge: .top, spacing: 0) {
            VStack(alignment: .leading, spacing: 24) {
                MeetingListHeading(
                    empty: owner.selection.display == .list && owner.empty, create: create
                )
                .frame(minHeight: 44)
                HomeTabs(invitations: $invitations)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 24).padding(.vertical, 12)
            .background { MeetingHeadingBackground(scrolled: scrolled) }
            .animation(reduceMotion ? nil : .easeOut(duration: 0.18), value: scrolled)
            .padding(.bottom, 6)
            .zIndex(1)
        }
        .background(AppPalette.background)
    }
}
